# Salir a producción — checklist de venta

## 1. Publicar el site (10 min)

```bash
npm i -g vercel
cd multiatlas-studio/dist/multiatlas-studio
vercel deploy --prod
```

Te dará una URL tipo `multiatlas-studio.vercel.app`. Conecta tu dominio (ej. `studio.multiatlas.mx`) en el dashboard de Vercel → Settings → Domains.

Publica también la galería: `cd ../registry && vercel deploy --prod` (ej. `registry.multiatlas.mx`).

## 2. Activar el formulario de leads (2 min)

El formulario ya apunta a FormSubmit → `rubentoledano@multiatlas.net`.

- **El primer envío** te llegará como email de FormSubmit pidiendo confirmar. Haz clic en "Activate" una vez y todos los leads posteriores llegan directo a tu inbox.
- Haz tú mismo el primer envío de prueba desde el site publicado.

## 3. Cobros (cuando tengas cuenta Stripe)

1. Crea 2 Payment Links en Stripe: Pro $19/mes (recurrente) y Founding $249 (único).
2. Pégalos en `packages/registry/sections/pricing-duo/meta.json` → `p1_href` y `p2_href` (o en la sección pricing de `sites/multiatlas-studio.json`).
3. `node packages/engine/compose.mjs sites/multiatlas-studio.json` y redeploy.

Mientras no existan, los botones de pricing llevan al formulario — un humano cierra la venta. Para $249 con 100 plazas, cerrar por email/llamada es incluso mejor.

## 4. WhatsApp (opcional, recomendado en MX)

Pásame tu número y añado botón flotante `wa.me` con mensaje precargado.

## 5. Pendientes de honestidad (antes de escalar tráfico)

- **Testimonios:** la sección existe en el registry pero NO está en la landing pública porque serían inventados. Al primer cliente real, pídele una frase y la reactivamos.
- **Galería:** los 6 proyectos son placeholders de color. Sustituir por screenshots de sites reales conforme se entreguen (el primero puede ser esta misma landing).
- **Countdown:** desactivado (falsa urgencia). Se activa poniendo horas reales en `countdown_hours` solo si hay una fecha límite verdadera.

## 6. Vender (hoy)

El pitch para agencias con la URL publicada:

> "Somos Multiatlas, agencia con 30+ años. Producimos sites premium white-label a $300–600 USD en menos de 5 días — tu marca, nuestra producción. Mira nuestro nivel: [URL]. ¿Te muestro una demo con uno de TUS clientes?"

Meta de la semana (plan F1): 8 mensajes enviados. El registro de cada prospecto va en `context/crm-agencias.md`.

## 7. Generador de la landing — "describe → preview → contacto" (NUEVO)

La landing ahora abre con la sección `#generador` (registry: `studio-generator`). El flujo:
el visitante describe su negocio + deja su email → ve al instante una **preview real** (el demo del
registry que mejor calza con su giro: clínica / inmobiliaria / restaurante) → el CTA lo lleva al
formulario de contacto **con su descripción y email ya prellenados**, para que un humano cierre.

Es **nivel 1: sin IA en vivo** (cero costo por generación). La preview es un demo representativo, y así
está etiquetado con honestidad ("ejemplo real del motor · tu página se diseña a la medida"). No genera
una página nueva por visitante; eso es el nivel 2.

Cosas a saber para producción:

- **Captura de lead instantánea:** al generar, hace un `fetch` best-effort al endpoint AJAX de FormSubmit
  `https://formsubmit.co/ajax/rubentoledano@multiatlas.net`. Ese endpoint AJAX **también requiere
  activarse una vez** (igual que el clásico del §2): haz un primer "Crear mi página" desde el site ya
  publicado y confirma el email de activación de FormSubmit. Si no se activa, no pasa nada grave: el
  cierre real es el formulario de contacto, que sí queda prellenado.
- **Cambiar el correo de leads:** edita `lead_endpoint` en
  `packages/registry/sections/studio-generator/meta.json` y recompila.
- **Ajustar el matching de giro:** las palabras clave por demo están en `d1_kw` / `d2_kw` / `d3_kw` del
  mismo `meta.json`. Para añadir más giros, agrega demos al registry y amplía el mapeo en la sección.
- **Nivel 2 (futuro, con costo):** conectar el `pipeline.mjs` real detrás del generador para producir una
  página única por brief (requiere `ANTHROPIC_API_KEY`, backend y un límite de 1 generación gratis por
  email para no dispararse el costo ~$2.50–4 USD/página).

Recompilar tras cualquier cambio:
```bash
node packages/engine/build-previews.mjs
node packages/engine/compose.mjs sites/multiatlas-studio.json dist/multiatlas-studio
node packages/engine/build-gallery.mjs
node packages/engine/check-links.mjs
```

## 8. Studio self-serve — el producto DESPUÉS de comprar (NUEVO)

La app a la que entra el suscriptor. Vive en `dist/multiatlas-studio/app/` (se despliega junto con la
landing; el pricing enlaza a `app/index.html`). Fuente estable en `app/index.html`; datos del registry en
`dist/multiatlas-studio/app/registry-data.js` (generado).

**Qué hace:** el usuario elige una plantilla (los 3 demos o "desde cero"), edita cada sección en vivo,
cambia el tema, reordena/añade/quita secciones y **descarga su site real** (HTML autocontenido, con los
logos embebidos como data-URI). El motor `compose` corre en el navegador — verificado idéntico a
`compose.mjs` (paridad 32/32 secciones, cero placeholders). "Publicar con la agencia" abre un mailto a
`rubentoledano@multiatlas.net` con el resumen del site.

**Regenerar la app tras cambiar secciones/temas/demos:**
```bash
node packages/engine/build-app-data.mjs   # reempaqueta registry-data.js y copia app/index.html al dist
```

**Conectar el cobro (Stripe):** en `app/index.html`, los botones del gate tienen `data-checkout="1"`.
Hoy entran directo al Studio para probar. Para cobrar de verdad, en el handler del gate (busca
`[checkout]`) reemplaza el `console.log` por `window.location = "<STRIPE_PAYMENT_LINK>"`, y en la página
de éxito de Stripe (`?success`) redirige a `app/index.html`. Pro = link recurrente $19/mes, Founding =
link único $249 (los mismos del §3).

**Pendiente para nivel 2 (IA en vivo dentro del Studio):** hoy el Studio edita con textos manuales +
defaults curados (cero costo, sin backend). Para que la IA escriba el copy sola por sección haría falta
un endpoint serverless que llame a `pipeline.mjs` server-side (la `ANTHROPIC_API_KEY` NO puede ir en el
navegador). Ese endpoint recibe el brief y devuelve el `copy` por sección; el Studio ya está listo para
inyectarlo en `state.config`. Costo ~$2.50–4 USD/página → limitar a plan Pro/Founding.

Verificación local: el sandbox bloquea el CDN de Tailwind, así que para ver el Studio con estilos hay que
abrir `dist/multiatlas-studio/app/index.html` en un navegador normal (en la nube se probó con shim + el
flujo funcional completo: gate→plan→preset→preview en vivo→editar→añadir→descargar, sin errores).
