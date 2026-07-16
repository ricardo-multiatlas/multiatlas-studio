/* Arma una CONFIG del motor a partir del contenido que devuelve la IA (usado por /api/generate).
 * Sin dependencias externas (solo REGISTRY) → testeable en local. */
import { REGISTRY } from "./_registry.js";

export const ARCHETYPES = ["local", "food", "b2b", "saas", "portfolio", "store", "realestate", "hospitality", "creator", "edu"];
export const THEME_CHOICES = ["multiatlas", "linear", "stripe", "notion", "vercel", "spotify", "airbnb", "coinbase", "figma", "monochrome", "editorial"];
export const FX_CHOICES = ["none", "glass", "clay", "neu", "brutal"];
const ICONS = ["◈", "✦", "◐", "▣", "◎", "✚", "▲", "●"];
const BENTO_SPANS = { 3: ["2", "2", "2"], 4: ["4", "2", "2", "4"], 5: ["4", "2", "2", "2", "2"], 6: ["4", "2", "2", "2", "2", "6"] };

function pickTheme(name) {
  const n = String(name || "").toLowerCase();
  if (REGISTRY.themes[n]) return n;
  if (REGISTRY.brands && REGISTRY.brands[n]) return n;
  return "multiatlas";
}
function anim(i) { return ["up", "left", "right", "zoom", "rise", "blur"][i % 6]; }
function slug(n) { return String(n || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, ""); }

export function buildConfig(c) {
  c = c || {};
  const name = c.businessName || "Tu negocio";
  const arch = ARCHETYPES.includes(c.archetype) ? c.archetype : "b2b";
  const theme = pickTheme(c.theme);
  const fx = FX_CHOICES.includes(c.fx) && c.fx !== "none" ? "fx-" + c.fx : "";
  const h = c.hero || {};
  const links = [];
  const sections = [];
  let ai = 0;

  const navIdx = sections.push({ use: "nav-simple", copy: {}, anim: "" }) - 1;

  sections.push({ use: "hero-glow", anim: "up", copy: {
    eyebrow: name, headline_1: h.h1 || "Bienvenido a", headline_em: h.em || name, headline_2: h.h2 || "",
    sub: h.sub || "", cta: "Empezar", cta_href: "#contacto", cta2: "Conocer más", cta2_href: "#features",
    bg_img: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1400&q=60",
  }});

  if (Array.isArray(c.features) && c.features.length) {
    const feats = c.features.slice(0, 6);
    const spans = BENTO_SPANS[feats.length] || feats.map(() => "2");
    sections.push({ use: "features-bento", anim: anim(ai++), copy: {
      eyebrow: "Por qué nosotros", headline: `Por qué elegir ${name}`, sub: "Lo que nos hace distintos.",
      features: feats.map((f, i) => ({ span: spans[i] || "2", icon: ICONS[i % ICONS.length], title: f.title || "", desc: f.desc || "" })),
    }});
    links.push({ label: "Ventajas", href: "#features" });
  }
  if (Array.isArray(c.services) && c.services.length) {
    sections.push({ use: "services-grid", anim: anim(ai++), copy: {
      eyebrow: "Servicios", headline: `Servicios de ${name}`, sub: "Todo lo que necesitas, en un lugar.",
      services: c.services.slice(0, 6).map((s, i) => ({ icon: ICONS[i % ICONS.length], title: s.title || "", desc: s.desc || "", price: s.price || "" })),
    }});
    links.push({ label: "Servicios", href: "#servicios" });
  }
  if (Array.isArray(c.stats) && c.stats.length) {
    sections.push({ use: "stats-band", anim: "stagger", copy: {
      stats: c.stats.slice(0, 4).map(s => ({ n: String(s.n || ""), suf: s.suf || "", label: s.label || "" })),
    }});
  }
  if (Array.isArray(c.testimonials) && c.testimonials.length) {
    sections.push({ use: "testimonials-marquee", anim: "stagger", copy: {
      eyebrow: "Testimonios", headline: "Lo que dicen de nosotros",
      testis: c.testimonials.slice(0, 4).map(t => ({ quote: t.quote || "", name: t.name || "", role: t.role || "" })),
    }});
  }
  if (Array.isArray(c.faqs) && c.faqs.length) {
    sections.push({ use: "faq-accordion", anim: anim(ai++), copy: {
      eyebrow: "FAQ", headline: "Preguntas frecuentes",
      faqs: c.faqs.slice(0, 5).map(f => ({ q: f.q || "", a: f.a || "" })),
    }});
    links.push({ label: "Preguntas", href: "#faq" });
  }

  sections.push({ use: "cta-banner", anim: "zoom", copy: {
    headline: `¿Listo para empezar con ${name}?`, sub: "Da el primer paso hoy. Te respondemos en menos de 24 horas.",
    cta: "Contáctanos", cta_href: "#contacto",
  }});
  sections.push({ use: "contact-form", anim: anim(ai++), copy: {
    eyebrow: c.ctaLabel || "Contacto", headline: `Contacta a ${name}`, sub: "Te respondemos en menos de 24 horas.",
    form_action: "#", email_directo: "hola@" + (slug(name).slice(0, 16) || "negocio") + ".mx",
    nota: "Formulario de ejemplo — en tu sitio real, los mensajes llegan a tu correo o WhatsApp.",
  }});
  sections.push({ use: "footer-cta", anim: "up", copy: {
    brand: name, tagline: `${name}. Sitio creado con Multiatlas Studio.`, headline: `${name} te espera`,
    legal: `${name} — sitio generado con Multiatlas Studio.`,
  }});

  sections[navIdx].copy = {
    brand: name, cta: c.ctaLabel || "Contacto", cta_href: "#contacto",
    link1: (links[0] || {}).label || "", link1_href: (links[0] || {}).href || "#contacto",
    link2: (links[1] || {}).label || "", link2_href: (links[1] || {}).href || "#contacto",
    link3: (links[2] || {}).label || "", link3_href: (links[2] || {}).href || "#contacto",
  };

  return {
    name: slug(name).replace(/(.{1,32}).*/, "$1") || "site",
    lang: "es", theme, fx, scroll: "",
    meta: { title: `${name} — creado con Multiatlas Studio`, description: h.sub || "" },
    sections,
  };
}
