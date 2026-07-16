#!/usr/bin/env node
/** Genera preview.html standalone por cada sección del registry (con sus defaults). */
import { readdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOT, renderSection, loadTheme, pageShell, wrapSection } from "./compose.mjs";

const REGISTRY = join(ROOT, "packages", "registry", "sections");
const theme = process.argv[2] ?? "multiatlas";
const tokens = loadTheme(theme);

let n = 0;
for (const slug of readdirSync(REGISTRY)) {
  const meta = JSON.parse(readFileSync(join(REGISTRY, slug, "meta.json"), "utf8"));
  const html = pageShell({
    title: `${meta.title} — Multiatlas Studio Registry`,
    lang: "es",
    tokens,
    body: wrapSection(slug, renderSection(slug), "up"), // misma estructura .ma-sec[data-anim] que un site compuesto
  });
  writeFileSync(join(REGISTRY, slug, "preview.html"), html);
  n++;
}
console.log(`✅ ${n} previews generados (tema: ${theme})`);
