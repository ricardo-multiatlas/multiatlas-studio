# Multiatlas Studio

Generador **registry-first** de sitios web premium. En lugar de diseñar cada página desde cero, un motor propio
compone el sitio sobre secciones, paletas y tipografías **curadas a mano**, y lo **viste por industria**. Con el
Nivel 2, una IA (OpenRouter) escribe el copy y arma la estructura a partir de la descripción del negocio.

## Qué incluye
- **192 industrias**, cada una con estructura ÚNICA: distinto layout, navbar (4, incl. menú lateral), hero (4),
  nº y orden de secciones, animaciones, scroll, nº de items por sección, y **contenido y formulario por giro**.
- **Landing** con gancho de ventas + generador demo + galería de demos en vivo.
- **Explora** (`/explore`): catálogo navegable de las 192 industrias.
- **Studio** (`/app`): arma, edita en vivo, **genera con IA** y descarga el sitio.
- **Cobro** (Stripe) + **login/muro** (Clerk + Neon): sin suscripción se puede ver, no copiar/descargar.

## Estructura
```
app/ explore/            Studio y catálogo (HTML estático)
checkout/                stripe.js + auth.js (config de cobro y login) + success/ + cancel/
api/                     Funciones Vercel: checkout, webhook, export (muro), me, generate (IA), _db, _auth, _build
db/schema.sql            Tabla de suscripciones (Neon)
packages/
  registry/sections/     Secciones curadas (32)
  theme/                 Temas base + brands.json (95) + theme.css
  engine/                Motor: compose, industries (variación), build-*, check-links
sites/                   Landing + demos + presets
assets/                  Logos
dist/multiatlas-studio/  Salida compilada (la genera `npm run build`; se despliega en Vercel)
```

## Desarrollo / build
```bash
npm install          # deps de las funciones (@clerk/backend, @neondatabase/serverless, stripe)
npm run build        # compila todo a dist/multiatlas-studio
npx serve dist/multiatlas-studio -l 3000   # ver en local
```

## Deploy (Vercel)
Config en `vercel.json` (build + outputDirectory). Sube el repo a Vercel o usa el CLI:
```bash
vercel --prod
```

## Activar cobro, login e IA
Cada uno funciona por separado; sin configurar, el sitio corre en **modo demo**.
- **Cobro (Stripe):** ver [`STRIPE.md`](./STRIPE.md).
- **Login + muro (Clerk + Neon):** ver [`CLERK.md`](./CLERK.md). Correr `npm run migrate` con `DATABASE_URL`.
- **IA (OpenRouter):** define `OPENROUTER_API_KEY` (y opcional `OPENROUTER_MODEL`) en Vercel. Ver `.env.example`.

**Los secretos van SOLO en variables de entorno de Vercel** (o un `.env` local que NO se sube — está en
`.gitignore`). Nunca en el código ni en el cliente. Las llaves *publishable* de Clerk/Stripe (pk_) sí van en
`checkout/auth.js` y `checkout/stripe.js` porque son públicas.

## Licencias de referencias
`open-design/` y `ui-ux-pro-max-skill/` son repos externos de referencia (Apache-2.0 / MIT), no se versionan
aquí (están en `.gitignore`). Añadir un `CREDITS.md` con la atribución antes de comercializar.
