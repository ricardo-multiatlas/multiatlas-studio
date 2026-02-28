#!/usr/bin/env node
/**
 * Pipeline AI de Multiatlas Studio — registry-first, cero dependencias (fetch nativo).
 * Uso: ANTHROPIC_API_KEY=sk-... node pipeline.mjs <brief.json> [--dry-run]
 * brief: { name, negocio, industria, objetivo, tono?, idioma?, secciones_max? }
 * Costo aprox: $0.10 (Haiku) + $1.20 (Opus AD+QA) + ~$1.35 (Sonnet copy) ≈ $2.50–4/site
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { ROOT, composeSite } from "./compose.mjs";

const API = "https://api.anthropic.com/v1/messages";
const KEY = process.env.ANTHROPIC_API_KEY;
const MODELS = { haiku: "claude-haiku-4-5-20251001", sonnet: "claude-sonnet-5", opus: "claude-opus-4-8" };

async function llm(model, system, user, maxTokens = 4000) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "x-api-key": KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: MODELS[model], max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) throw new Error(`API ${model}: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const text = data.content.map(c => c.text ?? "").join("");
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error(`Sin JSON en respuesta de ${model}`);
  return JSON.parse(m[0]);
}

function registryCatalog() {
  const dir = join(ROOT, "packages", "registry", "sections");
  return readdirSync(dir).map(slug => {
    const m = JSON.parse(readFileSync(join(dir, slug, "meta.json"), "utf8"));
    return { slug: m.slug, title: m.title, category: m.category, tags: m.industry_tags, campos: Object.keys(m.defaults) };
  });
}

async function run(briefPath, dryRun) {
  const brief = JSON.parse(readFileSync(resolve(briefPath), "utf8"));
  const catalog = registryCatalog();
  console.log(`▸ Brief: ${brief.name} (${brief.industria}) — registry: ${catalog.length} secciones`);

  if (dryRun || !KEY) {
    if (!KEY) console.log("⚠ Sin ANTHROPIC_API_KEY — modo dry-run: compongo con defaults del registry.");
    const sections = ["hero-glow", "features-bento", "gallery-hover", "testimonials-marquee", "pricing-duo", "faq-accordion", "background-animated", "footer-cta"].map(use => ({ use }));
    const out = composeSite({ name: brief.name, lang: brief.idioma ?? "es", theme: "multiatlas", meta: { title: brief.name, description: brief.objetivo ?? "" }, sections });
    console.log(`✅ (dry-run) Site compuesto: ${out}`);
    return;
  }

  // 1 · HAIKU — clasificación y selección de secciones
  console.log("▸ [1/4] Haiku: seleccionando secciones…");
  const sel = await llm("haiku",
    "Eres el selector de secciones de Multiatlas Studio. Respondes SOLO JSON.",
    `Catálogo del registry:\n${JSON.stringify(catalog)}\n\nBrief del cliente:\n${JSON.stringify(brief)}\n\nElige y ordena ${brief.secciones_max ?? 8} secciones (slug) para una landing de conversión. JSON: {"sections":["slug",...],"racional":"1 línea"}`);
  console.log(`  → ${sel.sections.join(", ")}`);

  // 2 · OPUS — dirección de arte
  console.log("▸ [2/4] Opus: dirección de arte…");
  const ad = await llm("opus",
    "Eres director de arte senior de sites premium. Respondes SOLO JSON.",
    `Negocio: ${JSON.stringify(brief)}\nBase de marca Multiatlas (sobrio, editorial): bg #FAF8F4, texto #181A20, acento #1C2B4A, acento-2 #96742F. REGLA: paleta contenida, máximo UN acento protagonista, nada de neones ni multicolor.\nDevuelve tokens coherentes con el negocio del cliente. JSON: {"tokens":{"--ma-bg":"...","--ma-surface":"...","--ma-border":"...","--ma-text":"...","--ma-muted":"...","--ma-accent":"...","--ma-accent-2":"...","--ma-accent-3":"...","--ma-glow":"...","--ma-radius":"...","--ma-font-display":"...","--ma-font-body":"..."},"racional":"2 líneas"}`);

  // 3 · SONNET — copy por sección
  console.log("▸ [3/4] Sonnet: copywriting por sección…");
  const dir = join(ROOT, "packages", "registry", "sections");
  const sections = [];
  for (const slug of sel.sections) {
    const meta = JSON.parse(readFileSync(join(dir, slug, "meta.json"), "utf8"));
    const copy = await llm("sonnet",
      `Copywriter senior en ${brief.idioma ?? "español"}. Tono: ${brief.tono ?? "profesional cercano, directo, sin humo"}. Respondes SOLO JSON con exactamente las claves pedidas.`,
      `Negocio: ${JSON.stringify(brief)}\nSección "${meta.title}" (${meta.category}). Claves y ejemplos de formato:\n${JSON.stringify(meta.defaults)}\n\nEscribe el copy real para este negocio. Mismas claves, textos de longitud similar. JSON plano.`);
    sections.push({ use: slug, copy });
    console.log(`  ✓ ${slug}`);
  }

  // 4 · Compose + OPUS QA
  const config = { name: brief.name, lang: brief.idioma ?? "es", theme: { tokens: ad.tokens }, meta: { title: brief.name, description: brief.objetivo ?? "" }, sections };
  mkdirSync(join(ROOT, "sites"), { recursive: true });
  writeFileSync(join(ROOT, "sites", `${brief.name}.generated.json`), JSON.stringify(config, null, 2));
  const out = composeSite(config);
  console.log("▸ [4/4] Opus: QA final…");
  const qa = await llm("opus",
    "Eres QA de diseño y copy. Respondes SOLO JSON.",
    `Config del site generado:\n${JSON.stringify(config).slice(0, 20000)}\n\nRevisa consistencia de copy, jerarquía y coherencia de tema. JSON: {"aprobado":true|false,"issues":["..."],"score":0-10}`);
  console.log(`  → QA score: ${qa.score}/10 ${qa.aprobado ? "✅" : "⚠"} ${qa.issues?.length ? "· " + qa.issues.join(" · ") : ""}`);
  console.log(`✅ Site generado: ${out}\n   Config editable: sites/${brief.name}.generated.json`);
}

const [briefPath, flag] = process.argv.slice(2);
if (!briefPath) { console.error("Uso: node pipeline.mjs <brief.json> [--dry-run]"); process.exit(1); }
run(briefPath, flag === "--dry-run").catch(e => { console.error("🔴", e.message); process.exit(1); });
