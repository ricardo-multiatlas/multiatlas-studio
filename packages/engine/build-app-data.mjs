#!/usr/bin/env node
/**
 * Empaqueta el registry para que el motor corra en el navegador (app Studio self-serve).
 * Salida: dist/app/registry-data.js  →  window.MA_DATA = { sections, themes, themeCss, logos, presets, order }
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync, copyFileSync, cpSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./compose.mjs";
import { allIndustryConfigs, CATEGORIES } from "./industries.mjs";

const REG = join(ROOT, "packages", "registry", "sections");
const THEME = join(ROOT, "packages", "theme");
const OUT = join(ROOT, "dist", "multiatlas-studio", "app");
mkdirSync(OUT, { recursive: true });

// Secciones: meta + html. Excluye la sección del generador de la landing (no aplica dentro del builder).
const EXCLUDE = new Set(["studio-generator"]);
const slugs = readdirSync(REG).filter(s => !EXCLUDE.has(s));
const sections = {};
for (const slug of slugs) {
  const meta = JSON.parse(readFileSync(join(REG, slug, "meta.json"), "utf8"));
  const html = readFileSync(join(REG, slug, "section.html"), "utf8").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
  sections[slug] = { meta, html };
}

// Temas base (excluye brands.json, que tiene otra estructura)
const themes = {};
for (const f of readdirSync(THEME).filter(f => f.endsWith(".json") && f !== "brands.json")) {
  themes[f.replace(/\.json$/, "")] = JSON.parse(readFileSync(join(THEME, f), "utf8")).tokens;
}
const themeCss = readFileSync(join(THEME, "theme.css"), "utf8");
// Temas de marca (Linear, Stripe, Notion, Vercel…) extraídos de open-design → selector aparte.
let brands = {};
try { brands = JSON.parse(readFileSync(join(THEME, "brands.json"), "utf8")); } catch (_) {}

// Logos → data URI (para que el site exportado sea autocontenido)
function dataUri(file) {
  const svg = readFileSync(join(ROOT, "assets", file), "utf8");
  return "data:image/svg+xml," + encodeURIComponent(svg);
}
const logos = {
  "assets/logo-lockup.svg": existsSync(join(ROOT, "assets", "logo-lockup.svg")) ? dataUri("logo-lockup.svg") : "",
  "assets/logo.svg": existsSync(join(ROOT, "assets", "logo.svg")) ? dataUri("logo.svg") : "",
};

// Presets: los 3 demos como plantillas de arranque + uno genérico en blanco
function loadSite(name) {
  return JSON.parse(readFileSync(join(ROOT, "sites", `${name}.json`), "utf8"));
}
const presets = {
  clinica: { label: "Clínica / Salud", config: loadSite("demo-clinica") },
  inmobiliaria: { label: "Inmobiliaria", config: loadSite("demo-inmobiliaria") },
  restaurante: { label: "Restaurante", config: loadSite("demo-restaurante") },
  gimnasio: { label: "Gimnasio / Fitness", config: loadSite("preset-gimnasio") },
  agencia: { label: "Agencia / Portafolio", config: loadSite("preset-agencia") },
  cafeteria: { label: "Cafetería", config: loadSite("preset-cafeteria") },
  blanco: {
    label: "Desde cero (negocio genérico)",
    config: {
      name: "mi-negocio",
      lang: "es",
      theme: "multiatlas",
      meta: { title: "Mi negocio", description: "Site creado con Multiatlas Studio." },
      sections: [
        { use: "nav-simple", copy: {} },
        { use: "hero-glow", copy: {} },
        { use: "services-grid", copy: {} },
        { use: "steps-process", copy: {} },
        { use: "faq-accordion", copy: {} },
        { use: "contact-form", copy: {} },
        { use: "footer-cta", copy: {} },
      ],
    },
  },
};

// Orden sugerido de secciones en el panel (por categoría)
const order = slugs.slice().sort((a, b) => {
  const ca = sections[a].meta.category || "", cb = sections[b].meta.category || "";
  return ca.localeCompare(cb) || a.localeCompare(b);
});

const industries = allIndustryConfigs();
const payload = { sections, themes, themeCss, logos, presets, order, industries, categories: CATEGORIES, brands };
writeFileSync(join(OUT, "registry-data.js"), "window.MA_DATA = " + JSON.stringify(payload) + ";\n");

// Registry para el motor del SERVIDOR (/api/export compone el HTML solo a suscriptores).
const serverRegistry = { sections, themes, themeCss, logos, brands };
writeFileSync(join(ROOT, "api", "_registry.js"), "export const REGISTRY = " + JSON.stringify(serverRegistry) + ";\n");

// Copiar la app (fuente estable en app/index.html) al dist
const APP_SRC = join(ROOT, "app", "index.html");
if (existsSync(APP_SRC)) copyFileSync(APP_SRC, join(OUT, "index.html"));

// Copiar la página Explora (showcase) al dist
const EXPLORE_SRC = join(ROOT, "explore", "index.html");
if (existsSync(EXPLORE_SRC)) { mkdirSync(join(ROOT, "dist", "multiatlas-studio", "explore"), { recursive: true }); copyFileSync(EXPLORE_SRC, join(ROOT, "dist", "multiatlas-studio", "explore", "index.html")); }

// Copiar el cascarón de Stripe (config + páginas de retorno) y las funciones /api al dist
const DIST_ROOT = join(ROOT, "dist", "multiatlas-studio");
const CHECKOUT_SRC = join(ROOT, "checkout");
if (existsSync(CHECKOUT_SRC)) cpSync(CHECKOUT_SRC, join(DIST_ROOT, "checkout"), { recursive: true });
const API_SRC = join(ROOT, "api");
if (existsSync(API_SRC)) cpSync(API_SRC, join(DIST_ROOT, "api"), { recursive: true });

console.log(`OK app: ${slugs.length} secciones, ${Object.keys(themes).length} temas, ${Object.keys(presets).length} presets, ${industries.length} industrias → dist/multiatlas-studio/app/`);
