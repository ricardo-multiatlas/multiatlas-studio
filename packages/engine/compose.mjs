#!/usr/bin/env node
/**
 * Multiatlas Studio — Composer (cero dependencias)
 * Uso: node compose.mjs <config.json> [outDir]
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(__dirname, "..", "..");
const REGISTRY = join(ROOT, "packages", "registry", "sections");
const THEME_DIR = join(ROOT, "packages", "theme");

let BRANDS = null;
function loadBrands() {
  if (BRANDS) return BRANDS;
  try { BRANDS = JSON.parse(readFileSync(join(THEME_DIR, "brands.json"), "utf8")); } catch (_) { BRANDS = {}; }
  return BRANDS;
}
export function loadTheme(theme) {
  if (typeof theme === "object" && theme?.tokens) return theme.tokens;
  const name = typeof theme === "string" ? theme : "multiatlas";
  const file = join(THEME_DIR, `${name}.json`);
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8")).tokens;
  const b = loadBrands()[name];
  if (b) return b.tokens;
  return JSON.parse(readFileSync(join(THEME_DIR, "multiatlas.json"), "utf8")).tokens;
}

// Rellena una plantilla: primero expande bloques repetibles <!--@each key-->…<!--@end-->
// (data[key] debe ser un array de objetos), luego sustituye los {{campo}} de nivel superior.
export function fillTemplate(tpl, data) {
  const expanded = tpl.replace(/<!--@each\s+(\w+)-->([\s\S]*?)<!--@end-->/g, (_, key, inner) => {
    const arr = Array.isArray(data[key]) ? data[key] : [];
    return arr.map(item => inner.replace(/\{\{(\w+)\}\}/g, (_, k) => (item[k] ?? ""))).join("");
  });
  return expanded.replace(/\{\{(\w+)\}\}/g, (_, k) => (data[k] ?? ""));
}

export function renderSection(slug, copy = {}) {
  const dir = join(REGISTRY, slug);
  if (!existsSync(dir)) throw new Error(`Seccion no encontrada en registry: ${slug}`);
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
  const html = readFileSync(join(dir, "section.html"), "utf8");
  const data = { ...meta.defaults, ...copy };
  return fillTemplate(html, data);
}

export function famName(tok) {
  const m = (tok || "").match(/'([^']+)'|"([^"]+)"/);
  return m ? (m[1] || m[2]) : null;
}
const INTER_LINK = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";
// Fuentes del tema (aparte de Inter). Va en su propio <link> para que si una fuente de marca
// no existe en Google, la petición falle SOLA sin tumbar a Inter (el baseline).
export function fontsLink(tokens) {
  const fams = new Set();
  [tokens["--ma-font-display"], tokens["--ma-font-body"]].forEach(t => { const n = famName(t); if (n && n !== "Inter") fams.add(n); });
  if (!fams.size) return "";
  const q = [...fams].map(f => "family=" + encodeURIComponent(f).replace(/%20/g, "+") + ":wght@400;500;600;700").join("&");
  return "https://fonts.googleapis.com/css2?" + q + "&display=swap";
}

// Envuelve cada sección en .ma-sec[data-anim] para animación por sección (nav y fondos van sin envoltura).
export function wrapSection(slug, html, anim = "") {
  if (/^nav/.test(slug) || slug === "background-animated") return html;
  return `<div class="ma-sec" data-anim="${anim || "up"}">${html}</div>`;
}

export function pageShell({ title, description = "", lang = "es", tokens, body, fx = "", scroll = "" }) {
  const vars = Object.entries(tokens).map(([k, v]) => `${k}: ${v};`).join("\n      ");
  const themeCss = readFileSync(join(THEME_DIR, "theme.css"), "utf8");
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
<meta name="description" content="${description}" />
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${INTER_LINK}" rel="stylesheet" />
${fontsLink(tokens) ? `<link href="${fontsLink(tokens)}" rel="stylesheet" />` : ""}
<style>
    :root {
      ${vars}
    }
${themeCss}
</style>
</head>
<body class="ma-noise${fx ? " " + fx : ""}${scroll === "snap" ? " ma-snap" : ""}">
<script>document.body.classList.add("js")</script>
${body}
<script src="https://cdn.jsdelivr.net/npm/motion@10.18.0/dist/motion.min.js"></script>
<script>
(function(){
  // Reveal por IntersectionObserver (la variación de gesto la da el CSS de [data-anim]).
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("ma-in"); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".ma-reveal").forEach(function(el){ io.observe(el); });
  var M = window.Motion;
  if (M && M.animate) {
    document.body.classList.add("motion-on");
    document.querySelectorAll(".ma-btn").forEach(function(b){
      b.addEventListener("pointerenter", function(){ M.animate(b, { transform:"translateY(-2px) scale(1.02)" }, { duration:.25, easing:"ease-out" }); });
      b.addEventListener("pointerleave", function(){ M.animate(b, { transform:"none" }, { duration:.3, easing:"ease-out" }); });
    });
  }
  document.querySelectorAll(".ma-tilt").forEach(function(card){
    card.addEventListener("mousemove", function(ev){
      var r = card.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
      card.style.transform = "perspective(900px) rotateY(" + (x*6) + "deg) rotateX(" + (-y*6) + "deg)";
    });
    card.addEventListener("mouseleave", function(){ card.style.transform = ""; });
  });
  document.querySelectorAll("[data-countdown-hours]").forEach(function(el){
    var s = parseFloat(el.dataset.countdownHours) * 3600;
    if (!isFinite(s) || s <= 0) { el.style.display = "none"; return; }
    setInterval(function(){ s = Math.max(0, s - 1);
      var h = String(Math.floor(s/3600)).padStart(2,"0"), m = String(Math.floor(s%3600/60)).padStart(2,"0"), x = String(Math.floor(s%60)).padStart(2,"0");
      el.textContent = h + ":" + m + ":" + x; }, 1000);
  });
})();
</script>
</body>
</html>`;
}

export function composeSite(config, outDir) {
  const tokens = loadTheme(config.theme);
  const body = config.sections.map(s => wrapSection(s.use, renderSection(s.use, s.copy), s.anim)).join("\n\n");
  const html = pageShell({
    title: config.meta?.title ?? config.name,
    description: config.meta?.description ?? "",
    lang: config.lang ?? "es",
    tokens, body, fx: config.fx ?? "", scroll: config.scroll ?? "",
  });
  const dir = outDir ?? join(ROOT, "dist", config.name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  const assets = join(ROOT, "assets");
  if (existsSync(assets)) cpSync(assets, join(dir, "assets"), { recursive: true });
  return join(dir, "index.html");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const cfgPath = process.argv[2];
  if (!cfgPath) { console.error("Uso: node compose.mjs <config.json> [outDir]"); process.exit(1); }
  const config = JSON.parse(readFileSync(resolve(cfgPath), "utf8"));
  const out = composeSite(config, process.argv[3] && resolve(process.argv[3]));
  console.log(`OK Site compuesto: ${out} (${config.sections.length} secciones)`);
}
