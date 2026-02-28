# Multiatlas Studio — Motor F1

Plataforma de creación de sites premium con AI. **Registry-first:** el modelo nunca inventa diseño; compone sobre secciones curadas.

## Estructura

```
multiatlas-studio/
├── packages/
│   ├── registry/sections/<slug>/   # section.html (fragmento) + meta.json + preview.html (generado)
│   ├── theme/                      # tokens de tema (dark-glow, light-editorial) + theme.css compartido
│   └── engine/
│       ├── compose.mjs             # config.json → dist/<site>/index.html (cero dependencias)
│       ├── pipeline.mjs            # brief → Haiku (clasifica) → Opus (dirección de arte) → Sonnet (copy) → compose
│       ├── build-previews.mjs      # genera preview.html standalone por sección
│       └── build-gallery.mjs       # genera la galería pública (registry/index.html)
├── sites/                          # configs de sites (el "CRM" de producción)
└── dist/                           # output construido
```

## Uso

```bash
# 1. Previews de cada sección + galería pública
node packages/engine/build-previews.mjs
node packages/engine/build-gallery.mjs

# 2. Componer un site desde config manual
node packages/engine/compose.mjs sites/multiatlas-studio.json

# 3. Pipeline AI completo (requiere ANTHROPIC_API_KEY en el entorno)
node packages/engine/pipeline.mjs sites/brief-ejemplo.json
```

Output en `dist/<nombre>/index.html` — HTML autocontenido (Tailwind CDN + fuentes Google), listo para preview o deploy estático en Vercel.

## Reglas del registry

1. Nada entra sin curación visual del piloto.
2. Toda sección es temable: colores/tipografía SOLO vía `var(--ma-*)`, nunca hardcodeados.
3. Todo texto visible es placeholder `{{clave}}` con default en `meta.json` — el copy lo pone el engine.
4. Una sección = un directorio autocontenido. Sin imports entre secciones.

## Roadmap

- **F1 (esto):** registry 10 secciones + composer + pipeline AI. ✔
- **F2:** web pública Next.js con auth + Stripe (Free / Pro $19 / Founding $249), SEO programático por sección.
- **F3:** generador self-serve con chat + galería comunidad.
- **F4:** marketplace de creadores (70/30).
