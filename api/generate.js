/* ============================================================================
 * POST /api/generate — NIVEL 2: generación con IA (OpenRouter)
 * Recibe { prompt } (descripción del negocio) y devuelve una CONFIG lista para el
 * motor: el modelo escribe el copy en español y elige tema/efecto; el servidor arma
 * la estructura sobre secciones curadas. La API key vive SOLO en env (OPENROUTER_API_KEY).
 *
 * Modelo configurable con OPENROUTER_MODEL (default: openai/gpt-4o-mini).
 * Alternativas de mayor calidad: anthropic/claude-3.5-sonnet, openai/gpt-4o,
 * google/gemini-2.0-flash-001.
 * ==========================================================================*/
import { getUserId } from "./_auth.js";
import { buildConfig, ARCHETYPES, THEME_CHOICES, FX_CHOICES } from "./_build.js";

const SYSTEM_PROMPT =
`Eres el copywriter y director de arte de Multiatlas Studio. A partir de la descripción de un negocio, devuelves
SOLO un objeto JSON válido (sin texto extra) con este formato y todo el contenido en español natural, específico
para ese negocio (nada genérico):
{
  "businessName": "string",
  "archetype": uno de ${JSON.stringify(ARCHETYPES)},
  "theme": uno de ${JSON.stringify(THEME_CHOICES)},
  "fx": uno de ${JSON.stringify(FX_CHOICES)},
  "hero": { "h1": "string", "em": "1-2 palabras destacadas", "h2": "string", "sub": "1-2 frases" },
  "ctaLabel": "2-3 palabras (ej. 'Reservar','Cotizar')",
  "services": [ { "title": "string", "desc": "1 frase", "price": "corta (ej. 'desde $500' o 'Incluido')" } ],
  "features": [ { "title": "string", "desc": "1 frase" } ],
  "stats": [ { "n": "número", "suf": "'+','%','k+','años' o ''", "label": "string" } ],
  "faqs": [ { "q": "string", "a": "1-2 frases" } ],
  "testimonials": [ { "quote": "string", "name": "string", "role": "string" } ]
}
services 3-6, features 3-6, stats 3-4, faqs 3-5, testimonials 2-4. Elige archetype y theme que encajen con el
giro y el tono. Copy humano y vendedor, sin inventar cifras imposibles. Devuelve SOLO el JSON.`;

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) { res.status(501).json({ error: "IA no configurada. Define OPENROUTER_API_KEY en Vercel (ver DEPLOY.md)." }); return; }

  // Si Clerk está activo, exige login para generar (controla el gasto de la API).
  const userId = await getUserId(req);
  if (process.env.CLERK_SECRET_KEY && !userId) { res.status(401).json({ error: "Inicia sesión para generar con IA." }); return; }

  const prompt = (req.body && String(req.body.prompt || "")).slice(0, 1200).trim();
  if (!prompt) { res.status(400).json({ error: "Describe tu negocio para generar el sitio." }); return; }

  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
        temperature: 0.7, max_tokens: 1600,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: "Negocio: " + prompt },
        ],
      }),
    });
    if (!r.ok) { const t = await r.text(); res.status(502).json({ error: "OpenRouter: " + t.slice(0, 300) }); return; }
    const data = await r.json();
    const txt = data?.choices?.[0]?.message?.content;
    if (!txt) { res.status(502).json({ error: "La IA no devolvió contenido." }); return; }
    let content;
    try { content = JSON.parse(txt); }
    catch (_) { const m = txt.match(/\{[\s\S]*\}/); content = m ? JSON.parse(m[0]) : null; }
    if (!content) { res.status(502).json({ error: "La IA devolvió un formato inesperado." }); return; }
    res.status(200).json({ config: buildConfig(content) });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
