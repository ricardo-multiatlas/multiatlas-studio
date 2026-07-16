/* ============================================================================
 * Multiatlas Studio — Vercel Serverless Function (CASCARÓN)
 * POST /api/checkout  →  crea una Stripe Checkout Session y devuelve { url }.
 *
 * SOLO necesario si en checkout/stripe.js pones mode:"session".
 * Con Payment Links (mode:"links") NO hace falta desplegar nada de /api.
 *
 * ESCENARIO A: para pagar hay que estar logueado con Clerk. La sesión se etiqueta con
 * el userId de Clerk (client_reference_id + metadata) para que el webhook sepa a QUIÉN
 * darle acceso en la base de datos.
 *
 * Requisitos:
 *   1) npm i stripe (ya en package.json)
 *   2) Variables de entorno (ver .env.example):
 *        STRIPE_SECRET_KEY, PRICE_PRO, PRICE_FOUNDING, CLERK_SECRET_KEY
 * ==========================================================================*/
import { getUserId } from "./_auth.js";

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).json({ error: "method not allowed" }); return; }

  const key    = process.env.STRIPE_SECRET_KEY;
  const prices = { pro: process.env.PRICE_PRO, founding: process.env.PRICE_FOUNDING };

  if (!key || !prices.pro || !prices.founding) {
    res.status(501).json({
      error: "Stripe no configurado. Define STRIPE_SECRET_KEY, PRICE_PRO y PRICE_FOUNDING (ver .env.example)."
    });
    return;
  }

  // Escenario A: exige sesión de Clerk para pagar (solo cuando Clerk está configurado).
  const userId = await getUserId(req);
  if (process.env.CLERK_SECRET_KEY && !userId) {
    res.status(401).json({ error: "Inicia sesión para continuar con el pago." });
    return;
  }

  const body = req.body || {};
  const plan = body.plan === "founding" ? "founding" : "pro";

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key);
    const origin = req.headers.origin || "";

    const session = await stripe.checkout.sessions.create({
      // Pro = suscripción mensual ($19). Founding = pago único de por vida ($249).
      mode: plan === "founding" ? "payment" : "subscription",
      line_items: [{ price: prices[plan], quantity: 1 }],
      success_url: body.success_url || (origin + "/checkout/success/"),
      cancel_url:  body.cancel_url  || (origin + "/checkout/cancel/"),
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      client_reference_id: userId || undefined,
      metadata: { clerk_user_id: userId || "", plan },
    });

    res.status(200).json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: String((e && e.message) || e) });
  }
}
