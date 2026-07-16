/* Corre db/schema.sql contra Neon (crea la tabla subscriptions).
 * Necesita antes: npm install   (instala @neondatabase/serverless)
 * Uso:
 *   bash / git-bash:  DATABASE_URL="postgresql://..." node db/migrate.mjs
 *   PowerShell:       $env:DATABASE_URL="postgresql://..."; node db/migrate.mjs
 *   npm script:       npm run migrate     (con DATABASE_URL ya en el entorno) */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Pool } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('Falta DATABASE_URL. Ej:  DATABASE_URL="postgresql://..." node db/migrate.mjs');
  process.exit(1);
}
const sqlText = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "schema.sql"), "utf8");
const statements = sqlText.split(";").map(s => s.trim()).filter(s => s && !s.startsWith("--"));

const pool = new Pool({ connectionString: url });
try {
  for (const st of statements) await pool.query(st);
  const r = await pool.query("SELECT count(*)::int AS n FROM subscriptions");
  console.log("OK — tabla 'subscriptions' lista en Neon. Filas actuales:", r.rows[0].n);
} catch (e) {
  console.error("Error en la migración:", e.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
