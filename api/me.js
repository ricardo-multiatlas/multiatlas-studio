/* GET /api/me — estado de la sesión y suscripción del usuario actual.
 * El frontend lo usa para saber si habilita "Copiar / Descargar". */
import { getUserId } from "./_auth.js";
import { getSubscription } from "./_db.js";

export default async function handler(req, res) {
  const userId = await getUserId(req);
  if (!userId) { res.status(200).json({ signedIn: false, active: false, plan: "free" }); return; }
  let sub = null;
  try { sub = await getSubscription(userId); } catch (_) {}
  res.status(200).json({
    signedIn: true,
    userId,
    plan: (sub && sub.plan) || "free",
    active: !!sub && sub.status === "active",
  });
}
