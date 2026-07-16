/* Multiatlas Studio — acceso a la base de datos (Neon Postgres, serverless).
 * Lee DATABASE_URL de las variables de entorno (nunca en el código).
 * Si no está configurada, las funciones devuelven null → el sitio sigue en modo demo. */
import { neon } from "@neondatabase/serverless";

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
export const dbReady = !!sql;

export async function getSubscription(clerkUserId) {
  if (!sql || !clerkUserId) return null;
  const rows = await sql`
    SELECT plan, status, current_period_end
    FROM subscriptions WHERE clerk_user_id = ${clerkUserId} LIMIT 1`;
  return rows[0] || null;
}

export async function isActive(clerkUserId) {
  const s = await getSubscription(clerkUserId);
  return !!s && s.status === "active";
}

export async function upsertSubscription({ clerkUserId, email, plan, status, customerId, subscriptionId, periodEnd }) {
  if (!sql || !clerkUserId) return;
  await sql`
    INSERT INTO subscriptions (clerk_user_id, email, plan, status, stripe_customer_id, stripe_subscription_id, current_period_end, updated_at)
    VALUES (${clerkUserId}, ${email || null}, ${plan}, ${status}, ${customerId || null}, ${subscriptionId || null}, ${periodEnd || null}, now())
    ON CONFLICT (clerk_user_id) DO UPDATE SET
      email                  = COALESCE(EXCLUDED.email, subscriptions.email),
      plan                   = EXCLUDED.plan,
      status                 = EXCLUDED.status,
      stripe_customer_id     = COALESCE(EXCLUDED.stripe_customer_id, subscriptions.stripe_customer_id),
      stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, subscriptions.stripe_subscription_id),
      current_period_end     = EXCLUDED.current_period_end,
      updated_at             = now()`;
}

export async function setStatusByCustomer(customerId, status) {
  if (!sql || !customerId) return;
  await sql`UPDATE subscriptions SET status = ${status}, updated_at = now() WHERE stripe_customer_id = ${customerId}`;
}
