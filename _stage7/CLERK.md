# Login + muro de suscripción (Clerk + Neon) — guía de activación

Este proyecto trae el **cascarón** de login y del muro "solo suscriptores copian/descargan". Sin llaves,
el sitio funciona como demo (cualquiera entra y descarga). En cuanto pegas tus llaves y despliegas, se activa.

## Cómo funciona (arquitectura)
- **Frontend estático** + **funciones serverless** en `/api` (las mismas que ya usas para Stripe).
- **Clerk** = identidad (login/registro). La *publishable key* va en `checkout/auth.js`; la *secret key* en Vercel.
- **Neon (Postgres)** = guarda quién tiene suscripción activa (tabla `subscriptions`).
- **La regla clave (escenario B):** copiar/descargar el código pasa por `/api/export`, que en el SERVIDOR
  verifica sesión de Clerk + suscripción activa antes de entregar el HTML. Por eso "solo ver" es real: aunque
  alguien inspeccione el navegador, el código final solo lo entrega el servidor a quien pagó.
- **Escenario A:** para pagar hay que estar logueado. El checkout etiqueta la compra con el userId de Clerk,
  y el webhook de Stripe marca esa persona como `active` en Neon.

## Pasos

### 1. Base de datos (Neon) — crear la tabla
En Neon → tu proyecto → **SQL Editor**, pega el contenido de `db/schema.sql` y dale **Run**.
(Ya me diste la connection string; solo falta correr ese SQL una vez.)

### 2. Variables de entorno en Vercel (Settings → Environment Variables)
Pega estos valores (NUNCA en el código):
```
CLERK_SECRET_KEY=sk_...            # Clerk → API Keys → Secret keys
DATABASE_URL=postgresql://...      # Neon → Connection string
STRIPE_SECRET_KEY=sk_...           # (para el pago)
PRICE_PRO=price_...  PRICE_FOUNDING=price_...
STRIPE_WEBHOOK_SECRET=whsec_...    # tras crear el webhook
```

### 3. Publishable key de Clerk (frontend)
En `checkout/auth.js`, pon tu **publishable key** (empieza con `pk_`, es pública):
```js
publishableKey: "pk_live_....",
```
Y en `checkout/stripe.js`, pon `mode: "session"` y tu misma `publishableKey` (para cobrar por Checkout Session).

### 4. Webhook de Stripe
En Stripe → Webhooks → endpoint `https://TU-DOMINIO/api/webhook`, eventos
**`checkout.session.completed`** y **`customer.subscription.deleted`**. Copia el *Signing secret* a
`STRIPE_WEBHOOK_SECRET`.

### 5. Desplegar
`git push` a Vercel (o redeploy). Vercel instala las dependencias de `package.json`
(`@clerk/backend`, `@neondatabase/serverless`, `stripe`) y publica las funciones `/api`.

## Qué pasa según el usuario
- **Sin login:** puede navegar y previsualizar; al intentar copiar/descargar se le pide iniciar sesión.
- **Logueado sin suscripción:** ve y previsualiza todo, pero `/api/export` responde 403 → no copia ni guarda.
- **Logueado con suscripción activa:** `/api/export` le entrega el HTML final. Copia y descarga habilitados.

## Archivos del cascarón
- `checkout/auth.js` — carga Clerk en el frontend (config: publishableKey).
- `api/_auth.js` — verifica el token de Clerk en el servidor.
- `api/_db.js` — acceso a Neon (lee/escribe suscripciones).
- `api/me.js` — estado de sesión/suscripción del usuario.
- `api/export.js` — **entrega el código solo a suscriptores** (aquí vive el muro real).
- `api/checkout.js` / `api/webhook.js` — pago atado al usuario + escritura en Neon.
- `db/schema.sql` — la tabla `subscriptions`.

## Nota de seguridad
La *secret key* de Clerk, la de Stripe y la `DATABASE_URL` van **solo** en variables de entorno de Vercel,
nunca en el repo ni en el cliente. Si tu connection string quedó expuesta, rótala en Neon (Reset password).
