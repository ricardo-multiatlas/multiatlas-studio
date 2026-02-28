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

export function loadTheme(theme) {
  if (typeof theme === "object" && theme?.tokens) return theme.tokens;
  const name = typeof theme === "string" ? theme : "multiatlas";
  return JSON.parse(readFileSync(join(THEME_DIR, `${name}.json`), "utf8")).tokens;
}

export function renderSection(slug, copy = {}) {
  const dir = join(REGISTRY, slug);
  if (!existsSync(dir)) throw new Error(`Seccion no encontrada en registry: ${slug}`);
  const meta = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8"));
  const html = readFileSync(join(dir, "section.html"), "utf8");
  const data = { ...meta.defaults, ...copy };
  return html.replace(/\{\{(\w+)\}\}/g, (_, k) => (data[k] ?? ""));
}

export function pageShell({ title, description = "", lang = "es", tokens, body }) {
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
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Archivo:ital,wght@0,500;0,600;0,700;1,600&family=Space+Grotesk:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500&display=swap" rel="stylesheet" />
<style>
    :root {
      ${vars}
    }
${themeCss}
</style>
</head>
<body class="ma-noise">
<script>document.body.classList.add("js")</script>
${body}
<script>
const io = new IntersectionObserver((es) => es.forEach(e => e.isIntersecting && e.target.classList.add("ma-in")), { threshold: 0.12 });
document.querySelectorAll(".ma-reveal").forEach(el => io.observe(el));
document.querySelectorAll(".ma-tilt").forEach(card => {
  card.addEventListener("mousemove", (ev) => {
    const r = card.getBoundingClientRect();
    const x = (ev.clientX - r.left) / r.width - 0.5, y = (ev.clientY - r.top) / r.height - 0.5;
    card.style.transform = \`perspective(900px) rotateY(\${x * 6}deg) rotateX(\${-y * 6}deg)\`;
  });
  card.addEventListener("mouseleave", () => card.style.transform = "");
});
document.querySelectorAll("[data-countdown-hours]").forEach(el => {
  let s = parseFloat(el.dataset.countdownHours) * 3600;
  if (!isFinite(s) || s <= 0) { el.style.display = "none"; return; }
  setInterval(() => { s = Math.max(0, s - 1);
    const h = String(Math.floor(s/3600)).padStart(2,"0"), m = String(Math.floor(s%3600/60)).padStart(2,"0"), x = String(Math.floor(s%60)).padStart(2,"0");
    el.textContent = \`\${h}:\${m}:\${x}\`; }, 1000);
});
</script>
</body>
</html>`;
}

export function composeSite(config, outDir) {
  const tokens = loadTheme(config.theme);
  const body = config.sections.map(s => renderSection(s.use, s.copy)).join("\n\n");
  const html = pageShell({
    title: config.meta?.title ?? config.name,
    description: config.meta?.description ?? "",
    lang: config.lang ?? "es",
    tokens, body,
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
