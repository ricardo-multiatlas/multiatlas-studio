-- Multiatlas Studio — esquema de suscripciones (Neon Postgres)
-- Córrelo UNA vez en Neon → Dashboard → SQL Editor → pega esto → Run.
-- (El webhook de Stripe llena/actualiza esta tabla; /api/export y /api/me la leen.)

CREATE TABLE IF NOT EXISTS subscriptions (
  clerk_user_id           TEXT PRIMARY KEY,           -- id del usuario en Clerk (user_...)
  email                   TEXT,
  plan                    TEXT NOT NULL DEFAULT 'free',      -- 'free' | 'pro' | 'founding'
  status                  TEXT NOT NULL DEFAULT 'inactive',  -- 'active' | 'inactive' | 'canceled'
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_customer ON subscriptions (stripe_customer_id);
