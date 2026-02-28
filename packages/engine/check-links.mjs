#!/usr/bin/env node
/** QA automático: anclas, rutas relativas, placeholders y href muertos en dist/. */
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const DIST = join(ROOT, "dist", "multiatlas-studio");
function pages(dir) { let out = []; for (const e of readdirSync(dir)) { const p = join(dir, e); const st = statSync(p);
  if (st.isDirectory()) out = out.concat(pages(p)); else if (e.endsWith(".html")) out.push(p); } return out; }
let fails = 0;
for (const page of pages(DIST)) {
  const rel = page.slice(DIST.length + 1).split(sep).join("/");
  if (rel.startsWith("registry/previews/")) continue; // especímenes de sección, sin página alrededor
  let html = readFileSync(page, "utf8").replace(/<template[\s\S]*?<\/template>/g, ""); // código copiable no cuenta
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]));
  for (const [, h] of html.matchAll(/href="#([^"]+)"/g))
    if (!ids.has(h)) { console.log(`🔴 ${rel}: ancla rota #${h}`); fails++; }
  const dead = [...html.matchAll(/href="#"/g)].length;
  if (dead) { console.log(`🔴 ${rel}: href="#" muerto (${dead})`); fails++; }
  for (const [, url] of html.matchAll(/(?:href|src)="([^"#][^"]*)"/g)) {
    if (/^(https?:|mailto:|tel:|data:)/.test(url)) continue;
    if (!existsSync(join(dirname(page), url.split("#")[0]))) { console.log(`🔴 ${rel}: ruta inexistente ${url}`); fails++; }
  }
  const ph = [...html.matchAll(/\{\{(\w+)\}\}/g)];
  if (ph.length) { console.log(`🔴 ${rel}: ${ph.length} placeholders sin resolver`); fails++; }
}
if (fails) { console.log(`\n🔴 QA FALLÓ: ${fails} problemas`); process.exit(1); }
console.log("✅ QA de enlaces: todas las páginas publicables limpias");
