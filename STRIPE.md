# Cobro con Stripe — guía de activación

Este proyecto trae el **cascarón** de Stripe listo. No hay ninguna llave dentro (por seguridad):
tú pegas tus datos y queda activo. Elige **uno** de los dos caminos.

Todo el cobro pasa por **una sola puerta**: el *gate* del Studio (`/app/index.html`). La landing
manda a esa puerta (`/app/index.html?plan=pro` o `?plan=founding`), y ahí se dispara el pago.

Planes que ya vienen cableados: **Pro — $19/mes** (suscripción) y **Founding — $249 pago único** (de por vida).

---

## Camino A — Payment Links (recomendado, SIN backend)

El más rápido. No hay que desplegar código; solo pegas 2 URLs.

1. Entra a <https://dashboard.stripe.com/payment-links> y crea **dos** Payment Links:
   - **Pro:** producto recurrente de $19/mes.
   - **Founding:** producto de pago único de $249.
   - En cada link, en *After payment*, redirige a `https://TU-DOMINIO/checkout/success/`.
2. Abre **`checkout/stripe.js`** y edita:
   ```js
   mode: "links",
   links: {
     pro:      "https://buy.stripe.com/....",   // el link Pro
     founding: "https://buy.stripe.com/...."    // el link Founding
   },
   ```
3. Vuelve a construir y desplegar (ver *Build* abajo). Listo — los botones ya cobran.

> Con este camino, Stripe te avisa por correo de cada venta y das el acceso a mano.
> Las variables de `.env` **no** hacen falta.

---

## Camino B — Checkout Session (`/api`, acceso automatizable)

Si quieres crear la sesión desde tu backend y automatizar la entrega de acceso.

1. Instala la dependencia: `npm i stripe`
2. En Stripe crea el **Product** con sus dos **Prices** (Pro recurrente, Founding único) y copia los `price_...`.
3. Copia **`.env.example` → `.env`** (o pégalas en Vercel → *Settings → Environment Variables*) y rellena:
   `STRIPE_SECRET_KEY`, `PRICE_PRO`, `PRICE_FOUNDING` (y `STRIPE_WEBHOOK_SECRET` si usas webhook).
4. En **`checkout/stripe.js`**:
   ```js
   mode: "session",
   publishableKey: "pk_live_....",   // tu publishable key
   ```
5. Despliega en Vercel (detecta `/api/checkout.js` y `/api/webhook.js` como funciones automáticamente).
6. *(Opcional, acceso automático)* En <https://dashboard.stripe.com/webhooks> crea un endpoint a
   `https://TU-DOMINIO/api/webhook`, evento **`checkout.session.completed`**, copia el *Signing secret*
   (`whsec_...`) a `STRIPE_WEBHOOK_SECRET`, y completa el `TODO` de fulfillment en `api/webhook.js`.

---

## Estado por defecto: `mode: "off"`

Mientras no configures nada, los botones **no cobran**: dejan entrar al Studio en modo demo
(igual que hoy). Así el sitio funciona perfecto para mostrarlo antes de conectar el pago.

## Qué tocaste vs. qué no

- Editas **solo** `checkout/stripe.js` (y `.env` en el camino B). Nada más.
- No se modifican las páginas de industrias ni sus formularios: el cobro es **exclusivo** de Multiatlas.

## Build

```bash
node packages/engine/build-app-data.mjs   # copia checkout/ y api/ al dist
# (o el pipeline completo, ver DEPLOY.md)
```
Deploy en Vercel con raíz `dist/multiatlas-studio`. Páginas de retorno: `/checkout/success/` y `/checkout/cancel/`.
