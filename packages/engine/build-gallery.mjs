#!/usr/bin/env node
/** Genera la galería pública del registry: dist/registry/index.html (+ copia previews). */
import { readdirSync, readFileSync, writeFileSync, mkdirSync, copyFileSync, cpSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, loadTheme, pageShell } from "./compose.mjs";

const REGISTRY = join(ROOT, "packages", "registry", "sections");
const OUT = join(ROOT, "dist", "multiatlas-studio", "registry");
mkdirSync(join(OUT, "previews"), { recursive: true });
const ASSETS = join(ROOT, "assets");
if (existsSync(ASSETS)) cpSync(ASSETS, join(OUT, "previews", "assets"), { recursive: true });

const metas = readdirSync(REGISTRY).map(slug =>
  JSON.parse(readFileSync(join(REGISTRY, slug, "meta.json"), "utf8"))
);

const cards = metas.map(m => {
  copyFileSync(join(REGISTRY, m.slug, "preview.html"), join(OUT, "previews", `${m.slug}.html`));
  const code = readFileSync(join(REGISTRY, m.slug, "section.html"), "utf8");
  return `
  <div class="ma-card ma-reveal overflow-hidden flex flex-col">
    <div class="relative h-64 overflow-hidden" style="border-bottom: 1px solid var(--ma-border);">
      <iframe src="/registry/previews/${m.slug}.html" loading="lazy" class="absolute top-0 left-0 origin-top-left pointer-events-none" style="width: 300%; height: 300%; transform: scale(0.3333); border: 0;"></iframe>
      <a href="/registry/previews/${m.slug}.html" target="_blank" class="absolute inset-0" aria-label="Abrir preview de ${m.title}"></a>
    </div>
    <div class="p-5 flex items-center justify-between gap-3">
      <div><p class="font-semibold text-sm">${m.title}</p><p class="ma-muted text-xs mt-1">${m.category}</p></div>
      <button class="ma-btn ma-btn-ghost text-xs !px-4 !py-2" data-copy="${m.slug}">⧉ Copy</button>
    </div>
    <template id="code-${m.slug}">${code.replace(/</g, "&lt;")}</template>
  </div>`;
}).join("\n");

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
<script>
document.querySelectorAll("[data-copy]").forEach(btn => btn.addEventListener("click", async () => {
  const t = document.getElementById("code-" + btn.dataset.copy);
  const el = document.createElement("textarea"); el.innerHTML = t.innerHTML;
  await navigator.clipboard.writeText(el.value);
  btn.textContent = "✓ Copiado"; setTimeout(() => btn.textContent = "⧉ Copy", 1600);
}));
</script>`;

writeFileSync(join(OUT, "index.html"), pageShell({
  title: "Multiatlas Studio — Registry de secciones premium",
  description: "Biblioteca curada de secciones premium para sites creados con AI.",
  lang: "es",
  tokens: loadTheme("multiatlas"),
  body,
}));
console.log(`OK Galeria generada: ${join(OUT, "index.html")} (${metas.length} secciones)`);
