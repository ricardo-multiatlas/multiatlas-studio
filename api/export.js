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
const SHELL = '\n<script src="https://cdn.jsdelivr.net/npm/motion@10.18.0/dist/motion.min.js"><\/script>\n<script>(function(){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("ma-in");io.unobserve(e.target);}});},{threshold:.12,rootMargin:"0px 0px -8% 0px"});document.querySelectorAll(".ma-reveal").forEach(function(el){io.observe(el);});var M=window.Motion;if(M&&M.animate){document.body.classList.add("motion-on");document.querySelectorAll(".ma-btn").forEach(function(b){b.addEventListener("pointerenter",function(){M.animate(b,{transform:"translateY(-2px) scale(1.02)"},{duration:.25,easing:"ease-out"});});b.addEventListener("pointerleave",function(){M.animate(b,{transform:"none"},{duration:.3,easing:"ease-out"});});});}document.querySelectorAll(".ma-tilt").forEach(function(card){card.addEventListener("mousemove",function(ev){var r=card.getBoundingClientRect();var x=(ev.clientX-r.left)/r.width-0.5,y=(ev.clientY-r.top)/r.height-0.5;card.style.transform="perspective(900px) rotateY("+(x*6)+"deg) rotateX("+(-y*6)+"deg)";});card.addEventListener("mouseleave",function(){card.style.transform="";});});document.querySelectorAll("[data-countdown-hours]").forEach(function(el){var s=parseFloat(el.dataset.countdownHours)*3600;if(!isFinite(s)||s<=0){el.style.display="none";return;}setInterval(function(){s=Math.max(0,s-1);var h=String(Math.floor(s/3600)).padStart(2,"0"),m=String(Math.floor(s%3600/60)).padStart(2,"0"),x=String(Math.floor(s%60)).padStart(2,"0");el.textContent=h+":"+m+":"+x;},1000);});function splitChars(node,state){var kids=Array.prototype.slice.call(node.childNodes);kids.forEach(function(child){if(child.nodeType===3){var frag=document.createDocumentFragment();child.nodeValue.split(/(\\s+)/).forEach(function(part){if(!part)return;if(/^\\s+$/.test(part)){frag.appendChild(document.createTextNode(part));return;}var w=document.createElement("span");w.className="ma-word";for(var j=0;j<part.length;j++){var ch=part.charAt(j),cc=part.charCodeAt(j);if(cc>=0xD800&&cc<=0xDBFF&&j+1<part.length){ch+=part.charAt(j+1);j++;}var c=document.createElement("span");c.className="ma-ch";c.textContent=ch;c.style.transitionDelay=(120+state.i*28)+"ms";state.i++;w.appendChild(c);}frag.appendChild(w);});node.replaceChild(frag,child);}else if(child.nodeType===1){splitChars(child,state);}});}var chEls=document.querySelectorAll("[data-chars]");if(chEls.length){var ioCh=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("ma-in");ioCh.unobserve(e.target);}});},{threshold:.2});chEls.forEach(function(el){if(el.hasAttribute("data-chars-done"))return;el.setAttribute("data-chars-done","");splitChars(el,{i:0});ioCh.observe(el);});}var pxEls=document.querySelectorAll("[data-parallax]");if(pxEls.length){var pxTick=false;function pxApply(){pxTick=false;var y=window.scrollY;pxEls.forEach(function(el){var v=parseFloat(el.dataset.parallax)||0.12;el.style.transform="translate3d(0,"+(y*v)+"px,0)";});}window.addEventListener("scroll",function(){if(!pxTick){pxTick=true;requestAnimationFrame(pxApply);}},{passive:true});pxApply();}var cuEls=document.querySelectorAll("[data-countup]");if(cuEls.length){var ioCu=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;ioCu.unobserve(e.target);var el=e.target,text=el.textContent;var nums=text.match(/\\d+(?:[.,]\\d+)?/g);if(!nums||nums.length!==1)return;var m=text.match(/^([^\\d]*)(\\d+(?:[.,]\\d+)?)([\\s\\S]*)$/);if(!m)return;var pre=m[1],raw=m[2],suf=m[3];var sep=raw.indexOf(",")>-1?",":".";var target=parseFloat(raw.replace(",","."));var decs=(raw.split(/[.,]/)[1]||"").length;if(!isFinite(target))return;var t0=null;function step(ts){if(t0===null)t0=ts;var p=Math.min((ts-t0)/1200,1);var eased=1-Math.pow(1-p,3);var val=(target*eased).toFixed(decs);if(decs&&sep===",")val=val.replace(".",",");el.textContent=pre+val+suf;if(p<1)requestAnimationFrame(step);}requestAnimationFrame(step);});},{threshold:.4});cuEls.forEach(function(el){ioCu.observe(el);});}})();<\/script>';

function compose(cfg) {
  const tk = theme(cfg.theme);
  const body = (cfg.sections || []).map(s => wrapSec(s.use, renderSection(s.use, s.copy), s.anim)).join("\n");
  const vars = Object.keys(tk).map(k => k + ": " + tk[k] + ";").join(" ");
  let html = '<!DOCTYPE html><html lang="' + (cfg.lang || "es") + '"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/><title>' +
    ((cfg.meta && cfg.meta.title) || cfg.name || "") + '</title><meta name="description" content="' + ((cfg.meta && cfg.meta.description) || "") + '"/><script src="https://cdn.tailwindcss.com"><\/script><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>' +
    (fontsLink(tk) ? '<link href="' + fontsLink(tk) + '" rel="stylesheet"/>' : "") +
    "<style>:root{" + vars + "}" + REGISTRY.themeCss + "</style></head><body class=\"ma-noise" +
    (cfg.fx ? " " + cfg.fx : "") + (cfg.scroll === "snap" ? " ma-snap" : "") + (cfg.bg ? " has-bg" : "") + "\"><script>document.body.classList.add(\"js\")<\/script>" + (cfg.bg ? '<div class="ma-bg ma-bg-' + cfg.bg + '"></div>' : "") + body + SHELL + "</body></html>";
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
