/* ============================================================================
 * Multiatlas Studio — Vercel Serverless Function (CASCARÓN)
 * POST /api/webhook  →  recibe eventos de Stripe y concede acceso (fulfillment).
 *
 * SOLO necesario si cobras con Checkout Session/Subscriptions y quieres automatizar
 * la entrega de acceso. Con Payment Links puedes empezar sin webhook y dar acceso
 * a mano (Stripe te avisa por correo de cada venta).
 *
 * Configúralo en https://dashboard.stripe.com/webhooks apuntando a /api/webhook,
 * eventos: "checkout.session.completed", "customer.subscription.deleted".
 * Escribe la suscripción en Neon (tabla subscriptions) para que /api/export y /api/me
 * sepan quién puede copiar/descargar. Requisitos:
 *   1) npm i stripe (ya en package.json)
 *   2) Env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, DATABASE_URL
 *
 * La verificación de firma necesita el body CRUDO → desactivamos el bodyParser.
 * ==========================================================================*/
import { upsertSubscription, setStatusByCustomer } from "./_db.js";

export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.status(405).end(); return; }

  const key      = process.env.STRIPE_SECRET_KEY;
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!key || !whSecret) { res.status(501).json({ error: "webhook no configurado (falta STRIPE_WEBHOOK_SECRET)" }); return; }

  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key);
    const raw = await readRawBody(req);
    const sig = req.headers["stripe-signature"];
    const event = stripe.webhooks.constructEvent(raw, sig, whSecret);

    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const clerkUserId = (s.metadata && s.metadata.clerk_user_id) || s.client_reference_id || "";
        const plan = s.mode === "payment" ? "founding" : "pro";
        const email = s.customer_details && s.customer_details.email;
        if (clerkUserId) {
          await upsertSubscription({
            clerkUserId, email, plan, status: "active",
            customerId: typeof s.customer === "string" ? s.customer : (s.customer && s.customer.id),
            subscriptionId: typeof s.subscription === "string" ? s.subscription : null,
            periodEnd: null,
          });
        }
        console.log("[stripe] pago OK →", clerkUserId || "(sin userId)", plan);
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = typeof sub.customer === "string" ? sub.customer : (sub.customer && sub.customer.id);
        await setStatusByCustomer(customerId, "canceled");
        break;
      }
      default:
        break;
    }

    res.status(200).json({ received: true });
  } catch (e) {
    res.status(400).json({ error: "firma inválida: " + String((e && e.message) || e) });
  }
}
