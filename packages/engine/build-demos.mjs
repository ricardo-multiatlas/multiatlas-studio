#!/usr/bin/env node
/**
 * Multiatlas Studio — Compositor de demos (cero dependencias)
 * Compone todos los sites/demo-*.json en dist/multiatlas-studio/demos/<name>/
 * Uso: node build-demos.mjs
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { composeSite, ROOT } from "./compose.mjs";

const files = readdirSync(join(ROOT, "sites")).filter(f => /^demo-.*\.json$/.test(f));
for (const f of files) {
  const config = JSON.parse(readFileSync(join(ROOT, "sites", f), "utf8"));
  const out = composeSite(config, join(ROOT, "dist", "multiatlas-studio", "demos", config.name));
  console.log(`OK Demo compuesta: ${f} -> ${out} (${config.sections.length} secciones)`);
}
