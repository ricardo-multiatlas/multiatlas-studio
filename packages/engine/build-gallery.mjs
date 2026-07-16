#!/usr/bin/env node
/** Genera la galería pública del registry: dist/registry/index.html (+ copia previews).
 *  Incluye "Copy prompt" por sección: prompt de recreación (estilo motionsites, en inglés)
 *  generado EN BUILD TIME con HTML+CSS+JS mínimos. Las secciones con "premium": true en
 *  su meta.json muestran 🔒 Premium (enlace a pricing) en lugar del botón. */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadTheme, pageShell, renderSection, fontsLink } from "./compose.mjs";

const REGISTRY = join(ROOT, "packages", "registry", "sections");
const OUT = join(ROOT, "dist", "multiatlas-studio", "registry");
mkdirSync(join(OUT, "previews"), { recursive: true });
const ASSETS = join(ROOT, "assets");
if (existsSync(ASSETS)) cpSync(ASSETS, join(OUT, "previews", "assets"), { recursive: true });

const metas = readdirSync(REGISTRY).map(slug =>
  JSON.parse(readFileSync(join(REGISTRY, slug, "meta.json"), "utf8"))
);

/* ══════════════════════════════════════════════════════════════════
   Generador de prompts de recreación (build time)
   ══════════════════════════════════════════════════════════════════ */

const TOKENS = loadTheme("multiatlas");
const THEME_CSS = readFileSync(join(ROOT, "packages", "theme", "theme.css"), "utf8");
const INTER_LINK = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap";

// Parsea theme.css en bloques de nivel superior (reglas y @keyframes) contando llaves
// balanceadas. Se eliminan comentarios primero (incluye el bloque reduced-motion comentado).
function parseCssBlocks(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const blocks = [];
  let i = 0;
  while (i < clean.length) {
    const open = clean.indexOf("{", i);
    if (open === -1) break;
    const selector = clean.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (j < clean.length && depth > 0) {
      if (clean[j] === "{") depth++;
      else if (clean[j] === "}") depth--;
      j++;
    }
    const body = clean.slice(open + 1, j - 1);
    if (selector) blocks.push({ selector, body, text: `${selector} {${body}}` });
    i = j;
  }
  return blocks;
}
const CSS_BLOCKS = parseCssBlocks(THEME_CSS);

// Clases presentes en el HTML renderizado + clases que el shell añade en runtime
// (ma-in al revelar; ma-word/ma-ch al partir titulares [data-chars]).
function classesInHtml(html) {
  const set = new Set();
  for (const m of html.matchAll(/class="([^"]*)"/g)) m[1].split(/\s+/).forEach(c => c && set.add(c));
  if (set.has("ma-reveal") || html.includes("data-chars")) set.add("ma-in");
  if (html.includes("data-chars")) { set.add("ma-word"); set.add("ma-ch"); }
  return set;
}

// Matcher simple por nombre de clase: una regla entra si alguna de sus alternativas
// (separadas por coma) usa clases ma-*/fx- y TODAS están presentes en el HTML.
function ruleApplies(selector, present) {
  return selector.split(",").some(part => {
    const cls = part.match(/\.((?:ma|fx)-[\w-]+)/g);
    if (!cls) return false;
    return cls.every(c => present.has(c.slice(1)));
  });
}

// CSS mínimo para una sección: :root con tokens + base html/body + reglas ma-*/fx-
// usadas + @keyframes referenciados por esas reglas (en el orden original del archivo).
function cssForSection(present) {
  const isKf = b => b.selector.startsWith("@keyframes");
  const picked = new Set(CSS_BLOCKS.filter(b =>
    !isKf(b) && (b.selector === "html" || b.selector === "body" || ruleApplies(b.selector, present))
  ));
  // Nombres de animación referenciados en las reglas elegidas → sus @keyframes.
  const animNames = new Set();
  for (const b of picked) {
    for (const m of b.body.matchAll(/animation(?:-name)?\s*:\s*([^;]+)/g)) {
      m[1].split(/[\s,]+/).forEach(tok => tok && animNames.add(tok));
    }
  }
  for (const b of CSS_BLOCKS) {
    if (isKf(b) && animNames.has(b.selector.split(/\s+/)[1])) picked.add(b);
  }
  const root = `:root {\n${Object.entries(TOKENS).map(([k, v]) => `  ${k}: ${v};`).join("\n")}\n}`;
  return root + "\n" + CSS_BLOCKS.filter(b => picked.has(b)).map(b => b.text).join("\n");
}

// ── Snippets JS reales, copiados tal cual del shell (compose.mjs → pageShell) ──
const JS_REVEAL = `  // Reveal on scroll via IntersectionObserver (.ma-reveal → .ma-in)
  var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add("ma-in"); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".ma-reveal").forEach(function(el){ io.observe(el); });`;

const JS_CHARS = `  // Headline splitter [data-chars]: each word → .ma-word, each character → .ma-ch
  function splitChars(node, state) {
    var kids = Array.prototype.slice.call(node.childNodes);
    kids.forEach(function(child){
      if (child.nodeType === 3) {
        var frag = document.createDocumentFragment();
        child.nodeValue.split(/(\\s+)/).forEach(function(part){
          if (!part) return;
          if (/^\\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement("span"); w.className = "ma-word";
          for (var j = 0; j < part.length; j++) {
            var ch = part.charAt(j), cc = part.charCodeAt(j);
            if (cc >= 0xD800 && cc <= 0xDBFF && j + 1 < part.length) { ch += part.charAt(j + 1); j++; }
            var c = document.createElement("span"); c.className = "ma-ch"; c.textContent = ch;
            c.style.transitionDelay = (120 + state.i * 28) + "ms"; state.i++;
            w.appendChild(c);
          }
          frag.appendChild(w);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === 1) {
        splitChars(child, state);
      }
    });
  }
  var chEls = document.querySelectorAll("[data-chars]");
  if (chEls.length) {
    var ioCh = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add("ma-in"); ioCh.unobserve(e.target); } }); }, { threshold: 0.2 });
    chEls.forEach(function(el){
      if (el.hasAttribute("data-chars-done")) return;
      el.setAttribute("data-chars-done", "");
      splitChars(el, { i: 0 });
      ioCh.observe(el);
    });
  }`;

const JS_COUNTUP = `  // Count-up on [data-countup]: animates 0 → value in 1200ms (easeOutCubic)
  var cuEls = document.querySelectorAll("[data-countup]");
  if (cuEls.length) {
    var ioCu = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        ioCu.unobserve(e.target);
        var el = e.target, text = el.textContent;
        var nums = text.match(/\\d+(?:[.,]\\d+)?/g);
        if (!nums || nums.length !== 1) return;
        var m = text.match(/^([^\\d]*)(\\d+(?:[.,]\\d+)?)([\\s\\S]*)$/);
        if (!m) return;
        var pre = m[1], raw = m[2], suf = m[3];
        var sep = raw.indexOf(",") > -1 ? "," : ".";
        var target = parseFloat(raw.replace(",", "."));
        var decs = (raw.split(/[.,]/)[1] || "").length;
        if (!isFinite(target)) return;
        var t0 = null;
        function step(ts) {
          if (t0 === null) t0 = ts;
          var p = Math.min((ts - t0) / 1200, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          var val = (target * eased).toFixed(decs);
          if (decs && sep === ",") val = val.replace(".", ",");
          el.textContent = pre + val + suf;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    cuEls.forEach(function(el){ ioCu.observe(el); });
  }`;

const JS_PARALLAX = `  // Vertical parallax on [data-parallax] (factor via attribute; rAF-throttled scroll)
  var pxEls = document.querySelectorAll("[data-parallax]");
  if (pxEls.length) {
    var pxTick = false;
    function pxApply() {
      pxTick = false;
      var y = window.scrollY;
      pxEls.forEach(function(el){
        var v = parseFloat(el.dataset.parallax) || 0.12;
        el.style.transform = "translate3d(0," + (y * v) + "px,0)";
      });
    }
    window.addEventListener("scroll", function(){ if (!pxTick) { pxTick = true; requestAnimationFrame(pxApply); } }, { passive: true });
    pxApply();
  }`;

const JS_TILT = `  // Subtle 3D tilt on .ma-tilt cards
  document.querySelectorAll(".ma-tilt").forEach(function(card){
    card.addEventListener("mousemove", function(ev){
      var r = card.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
      card.style.transform = "perspective(900px) rotateY(" + (x*6) + "deg) rotateX(" + (-y*6) + "deg)";
    });
    card.addEventListener("mouseleave", function(){ card.style.transform = ""; });
  });`;

// Prompt completo de recreación de una sección (en inglés, estándar motionsites).
function buildPrompt(slug) {
  const html = renderSection(slug); // defaults ya rellenos (reutiliza compose.mjs)
  const present = classesInHtml(html);

  const behaviors = [];
  if (present.has("ma-reveal")) behaviors.push(JS_REVEAL);
  if (html.includes("data-chars")) behaviors.push(JS_CHARS);
  if (html.includes("data-countup")) behaviors.push(JS_COUNTUP);
  if (html.includes("data-parallax")) behaviors.push(JS_PARALLAX);
  if (present.has("ma-tilt")) behaviors.push(JS_TILT);

  const extraFonts = fontsLink(TOKENS);
  const parts = [
    `Recreate this ${slug} section exactly. Complete specifications:`,
    "",
    "## HTML",
    "",
    html.trim(),
    "",
    "## Required CSS",
    "",
    cssForSection(present),
    "",
    "## Fonts",
    "",
    `<link rel="preconnect" href="https://fonts.googleapis.com">`,
    `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`,
    `<link href="${INTER_LINK}" rel="stylesheet">`,
    ...(extraFonts ? [`<link href="${extraFonts}" rel="stylesheet">`] : []),
    "Note: the --ma-font-display token drives headings (.ma-display) and --ma-font-body drives body text — both are defined in the :root block above.",
  ];
  if (behaviors.length) {
    parts.push(
      "",
      "## JS behaviors",
      "",
      "<script>",
      "(function(){",
      `  document.body.classList.add("js"); // enables the CSS initial states (reveal/chars)`,
      behaviors.join("\n\n"),
      "})();",
      "</script>"
    );
  }
  parts.push(
    "",
    "Stack: static HTML + Tailwind CDN (script src https://cdn.tailwindcss.com). No build step, no frameworks."
  );
  return parts.join("\n");
}

/* ══════════════════════════════════════════════════════════════════
   Tarjetas + página de la galería
   ══════════════════════════════════════════════════════════════════ */

const cards = metas.map(m => {
  copyFileSync(join(REGISTRY, m.slug, "preview.html"), join(OUT, "previews", `${m.slug}.html`));
  // Secciones libres → botones "Copy" + "Copy prompt" (con su section.html embebido en <template>);
  // premium → 🔒 Premium enlazando a pricing, SIN exponer el código fuente en la página.
  const code = m.premium ? "" : readFileSync(join(REGISTRY, m.slug, "section.html"), "utf8");
  const copyAction = m.premium
    ? ""
    : `<button class="ma-btn ma-btn-ghost text-xs !px-4 !py-2" data-copy="${m.slug}">⧉ Copy</button>`;
  const promptAction = m.premium
    ? `<a href="../#pricing" class="ma-btn ma-btn-ghost text-xs !px-4 !py-2" aria-label="Sección premium — ver planes">🔒 Premium</a>`
    : `<button class="ma-btn ma-btn-ghost text-xs !px-4 !py-2" data-copy-prompt="${m.slug}">✦ Copy prompt</button>`;
  return `
  <div class="ma-card ma-reveal overflow-hidden flex flex-col">
    <div class="relative h-64 overflow-hidden" style="border-bottom: 1px solid var(--ma-border);">
      <iframe src="/registry/previews/${m.slug}.html" loading="lazy" class="absolute top-0 left-0 origin-top-left pointer-events-none" style="width: 300%; height: 300%; transform: scale(0.3333); border: 0;"></iframe>
      <a href="/registry/previews/${m.slug}.html" target="_blank" class="absolute inset-0" aria-label="Abrir preview de ${m.title}"></a>
    </div>
    <div class="p-5 flex items-center justify-between gap-3">
      <div><p class="font-semibold text-sm">${m.title}</p><p class="ma-muted text-xs mt-1">${m.category}</p></div>
      <div class="flex flex-wrap justify-end gap-2 shrink-0">
        ${copyAction}
        ${promptAction}
      </div>
    </div>
    ${m.premium ? "" : `<template id="code-${m.slug}">${code.replace(/</g, "&lt;")}</template>`}
  </div>`;
}).join("\n");

// Mapa slug → prompt SOLO de secciones libres (las premium no exponen su prompt).
// Escape < obligatorio: un "</script>" crudo dentro del JSON rompería el HTML.
const promptMap = JSON.stringify(
  Object.fromEntries(metas.filter(m => !m.premium).map(m => [m.slug, buildPrompt(m.slug)]))
).replace(/</g, "\\u003c");

const body = `
<header class="max-w-6xl mx-auto px-6 pt-10 flex items-center justify-between">
  <a href="/index.html" class="ma-display font-bold text-lg">◈ Multiatlas <span class="italic" style="color: var(--ma-accent-2);">Studio</span></a>
  <span class="ma-eyebrow">Registry v0.1 — ${metas.length} secciones</span>
</header>
<section class="text-center px-6 pt-20 pb-14 relative overflow-hidden">
  <div class="ma-glow-orb ma-pulse w-[480px] h-[480px] -top-56 left-1/2 -translate-x-1/2" style="background: var(--ma-glow);"></div>
  <h1 class="ma-display text-3xl md:text-5xl font-semibold relative z-10">La biblioteca de secciones <em class="italic" style="color: var(--ma-accent-2);">premium</em></h1>
  <p class="ma-muted mt-5 max-w-xl mx-auto relative z-10">Bloques curados a mano para construir y lanzar sites premium con AI, más rápido.</p>
</section>
<main class="max-w-6xl mx-auto px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">${cards}</main>
<script type="application/json" id="ma-prompts">${promptMap}</script>
<script>
document.querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", async () => {
  const t = document.getElementById("code-" + btn.dataset.copy);
  const el = document.createElement("textarea"); el.innerHTML = t.innerHTML;
  await copyText(el.value);
  btn.textContent = "✓ Copiado"; setTimeout(() => btn.textContent = "⧉ Copy", 1600);
}));
const prompts = JSON.parse(document.getElementById("ma-prompts").textContent);
document.querySelectorAll("[data-copy-prompt]").forEach(btn => btn.addEventListener("click", async () => {
  await copyText(prompts[btn.dataset.copyPrompt] || "");
  btn.textContent = "Copiado ✓"; setTimeout(() => btn.textContent = "✦ Copy prompt", 1500);
}));
// Copia con fallback textarea+execCommand (contextos sin Clipboard API o sin permiso).
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); }
  catch (_) {
    const ta = document.createElement("textarea"); ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove();
  }
}
</script>`;

writeFileSync(join(OUT, "index.html"), pageShell({
  title: "Multiatlas Studio — Registry de secciones premium",
  description: "Biblioteca curada de secciones premium para sites creados con AI.",
  lang: "es",
  tokens: TOKENS,
  body,
}));
console.log(`OK Galeria generada: ${join(OUT, "index.html")} (${metas.length} secciones, ${metas.filter(m => !m.premium).length} con Copy prompt)`);
