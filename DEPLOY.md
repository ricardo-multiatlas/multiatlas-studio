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
