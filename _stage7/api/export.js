/* POST /api/export — devuelve el HTML final del site SOLO a usuarios con suscripción activa.
 * Body: { config }  (la config del Studio: sections/theme/fx/scroll).
 * 401 si no hay sesión Clerk · 403 si no hay suscripción activa · 200 { html } si todo OK.
 * Aquí es donde el "solo ver, sin copiar/guardar" se hace REAL (no se puede saltar desde el navegador). */
import { getUserId } from "./_auth.js";
import { isActive } from "./_db.js";
import { REGISTRY } from "./_registry.js";

function fillTemplate(tpl, d) {
  const ex = tpl.replace(/<!--@each\s+(\w+)-->([\s\S]*?)<!--@end-->/g, (_, key, inner) => {
    const arr = Array.isArray(d[key]) ? d[key] : [];
    return arr.map(item => inner.replace(/\{\{(\w+)\}\}/g, (_, k) => (item[k] != null ? item[k] : ""))).join("");
  });
  return ex.replace(/\{\{(\w+)\}\}/g, (_, k) => (d[k] != null ? d[k] : ""));
}
function renderSection(slug, copy) {
  const s = REGISTRY.sections[slug]; if (!s) return "";
  const data = Object.assign({}, s.meta.defaults, copy || {});
  return fillTemplate(s.html, data);
}
function wrapSec(slug, html, anim) {
  if (/^nav/.test(slug) || slug === "background-animated") return html;
  return '<div class="ma-sec" data-anim="' + (anim || "up") + '">' + html + "</div>";
}
function theme(t) {
  if (t && typeof t === "object" && t.tokens) return t.tokens;
  const name = typeof t === "string" ? t : "multiatlas";
  return REGISTRY.themes[name] || (REGISTRY.brands && REGISTRY.brands[name] && REGISTRY.brands[name].tokens) || REGISTRY.themes.multiatlas;
}
function famName(t) { const m = (t || "").match(/'([^']+)'|"([^"]+)"/); return m ? (m[1] || m[2]) : null; }
function fontsLink(tk) {
  const f = new Set(); [tk["--ma-font-display"], tk["--ma-font-body"]].forEach(t => { const n = famName(t); if (n && n !== "Inter") f.add(n); });
  if (!f.size) return "";
  return "https://fonts.googleapis.com/css2?" + [...f].map(x => "family=" + encodeURIComponent(x).replace(/%20/g, "+") + ":wght@400;500;600;700").join("&") + "&display=swap";
}
const SHELL = '\n<script src="https://cdn.jsdelivr.net/npm/motion@10.18.0/dist/motion.min.js"><\/script>\n<script>(function(){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("ma-in");io.unobserve(e.target);}});},{threshold:.12,rootMargin:"0px 0px -8% 0px"});document.querySelectorAll(".ma-reveal").forEach(function(el){io.observe(el);});var M=window.Motion;if(M&&M.animate){document.body.classList.add("motion-on");document.querySelectorAll(".ma-btn").forEach(function(b){b.addEventListener("pointerenter",function(){M.animate(b,{transform:"translateY(-2px) scale(1.02)"},{duration:.25});});b.addEventListener("pointerleave",function(){M.animate(b,{transform:"none"},{duration:.3});});});}document.querySelectorAll(".ma-tilt").forEach(function(card){card.addEventListener("mousemove",function(ev){var r=card.getBoundingClientRect();var x=(ev.clientX-r.left)/r.width-0.5,y=(ev.clientY-r.top)/r.height-0.5;card.style.transform="perspective(900px) rotateY("+(x*6)+"deg) rotateX("+(-y*6)+"deg)";});card.addEventListener("mouseleave",function(){card.style.transform="";});});})();<\/script>';

function compose(cfg) {
  const tk = theme(cfg.theme);
  const body = (cfg.sections || []).map(s => wrapSec(s.use, renderSection(s.use, s.copy), s.anim)).join("\n");
  const vars = Object.keys(tk).map(k => k + ": " + tk[k] + ";").join(" ");
  let html = '<!DOCTYPE html><html lang="' + (cfg.lang || "es") + '"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>' +
    ((cfg.meta && cfg.meta.title) || cfg.name || "") + '</title><script src="https://cdn.tailwindcss.com"><\/script><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>' +
    (fontsLink(tk) ? '<link href="' + fontsLink(tk) + '" rel="stylesheet"/>' : "") +
    "<style>:root{" + vars + "}" + REGISTRY.themeCss + "</style></head><body class=\"ma-noise" +
    (cfg.fx ? " " + cfg.fx : "") + (cfg.scroll === "snap" ? " ma-snap" : "") + "\"><script>document.body.classList.add(\"js\")<\/script>" + body + SHELL + "</body></html>";
  Object.keys(REGISTRY.logos || {}).forEach(p => { if (REGISTRY.logos[p]) html = html.split(p).join(REGISTRY.logos[p]); });
  return html;
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const userId = await getUserId(req);
  if (!userId) { res.status(401).json({ error: "Inicia sesión para copiar o descargar tu site." }); return; }
  let ok = false;
  try { ok = await isActive(userId); } catch (e) { res.status(500).json({ error: "No se pudo verificar la suscripción." }); return; }
  if (!ok) { res.status(403).json({ error: "Necesitas una suscripción activa para copiar o descargar el código." }); return; }
  const cfg = req.body && req.body.config;
  if (!cfg || !cfg.sections) { res.status(400).json({ error: "Falta la configuración del site." }); return; }
  try { res.status(200).json({ html: compose(cfg) }); }
  catch (e) { res.status(500).json({ error: String((e && e.message) || e) }); }
}
