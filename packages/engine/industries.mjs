/**
 * Taxonomía de industrias de Multiatlas Studio — potenciada con UI UX Pro Max.
 * 192 industrias, cada una con su PALETA CURADA (WCAG) + keywords + anti-patrones.
 *
 * MOTOR DE VARIACIÓN ESTRUCTURAL (2026-07-16): cada industria recibe una SEMILLA
 * determinista (estable entre builds) que elige un BLUEPRINT distinto (nº/orden/tipo
 * de secciones), un NAVBAR distinto (incl. menú lateral), una ANIMACIÓN por sección y
 * un TIPO DE SCROLL. Así 192 industrias dejan de compartir el mismo molde.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const __dir = dirname(fileURLToPath(import.meta.url));
const DATA = JSON.parse(readFileSync(join(__dir, "industry-data.json"), "utf8"));
const ES = JSON.parse(readFileSync(join(__dir, "industry-es.json"), "utf8"));
const ESBY = Object.fromEntries(ES.map(e => [e.key, e]));
let FONTSBY = {};
try { FONTSBY = JSON.parse(readFileSync(join(__dir, "industry-fonts.json"), "utf8")); } catch (_) {}

// ─────────────────────────────────────────────────────── RNG determinista (sin Date/Math.random)
function seedFor(key) { let h = 2166136261 >>> 0; const s = String(key); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function makeRng(seed) { let a = seed >>> 0; return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const pickR = (r, arr) => arr[Math.floor(r() * arr.length)];

// ─────────────────────────────────────────────────────── Imágenes por familia (Unsplash)
const IMG = {
  food: ["photo-1517248135467-4c7edcad34c4","photo-1552566626-52f8b828add9","photo-1414235077428-338989a2e8c0","photo-1554118811-1e0d58224f24"],
  salud: ["photo-1629909613654-28e377c37b09","photo-1576091160550-2173dba999ef","photo-1631217868264-e5b90bb7e133"],
  pro: ["photo-1600880292203-757bb62b4baf","photo-1521737604893-d14cc237f11d","photo-1454165804606-c3d57bc86b40"],
  saas: ["photo-1551288049-bebda4e38f71","photo-1518770660439-4636190af475","photo-1526374965328-7f61d4dc18c5"],
  creativo: ["photo-1558655146-9f40138edfeb","photo-1561070791-2526d30994b5","photo-1519681393784-d120267933ba"],
  tienda: ["photo-1441984904996-e0b6ba687e04","photo-1483985988355-763728e1935b","photo-1490481651871-ab68de25d43d"],
  inmob: ["photo-1512917774080-9991f1c4c750","photo-1600585154340-be6161a56a0c","photo-1600607687939-ce8a6c25118c"],
  hotel: ["photo-1566073771259-6a8506099945","photo-1520250497591-112f2f40a3f4","photo-1571003123894-1f0594d2b5d9"],
  edu: ["photo-1523240795612-9a054b0db644","photo-1509062522246-3755977927d7","photo-1524178232363-1fb2b075b655"],
};
const U = (id) => `https://images.unsplash.com/${id}?w=1400&q=60`;
const pick = (fam, i) => U((IMG[fam] || IMG.pro)[i % (IMG[fam] || IMG.pro).length]);

const CAT_FAM = {
  "Tecnología":"saas","Ecommerce & Tienda":"tienda","Salud & Bienestar":"salud","Finanzas & Legal":"pro",
  "Comida & Bebida":"food","Hospitalidad & Viajes":"hotel","Inmobiliaria & Construcción":"inmob",
  "Creativos & Portafolio":"creativo","Creadores & Contenido":"creativo","Educación":"edu",
  "Empresas & B2B":"pro","Marketing & Ventas":"pro","Entretenimiento & Juegos":"creativo",
  "Comunidad & Social":"saas","Otros":"pro",
};

// ─────────────────────────────────────────────────────── Ancla + etiqueta por sección (navs dinámicos, sin anclas muertas)
const ANCHOR = {
  "services-grid":["servicios","Servicios"], "features-bento":["features","Ventajas"], "feature-split":["features","Cómo funciona"],
  "pricing-trio":["pricing","Planes"], "pricing-duo":["pricing","Precios"], "gallery-grid":["gallery","Galería"],
  "menu-list":["menu","Menú"], "listings-grid":["propiedades","Propiedades"], "location-hours":["ubicacion","Ubicación"],
  "faq-accordion":["faq","Preguntas"], "steps-process":["proceso","Proceso"], "team-cards":["equipo","Equipo"],
  "contact-form":["contacto","Contacto"],
};

// ─────────────────────────────────────────────────────── BLUEPRINTS: 3+ arreglos por arquetipo (distinto nº/orden/tipo)
// (sin nav ni footer: el motor antepone el nav elegido y añade footer-cta al final).
const BLUEPRINTS = {
  local: [
    ["hero-split","services-grid","steps-process","testimonial-quote","location-hours","cta-banner","contact-form"],
    ["hero-glow","stats-band","services-grid","feature-split","team-cards","testimonials-marquee","faq-accordion","location-hours","cta-banner","contact-form"],
    ["hero-center","gallery-grid","services-grid","feature-split","testimonial-quote","location-hours","contact-form"],
  ],
  food: [
    ["hero-glow","menu-list","feature-split","location-hours","testimonial-quote","cta-banner","contact-form"],
    ["hero-split","gallery-grid","menu-list","stats-band","testimonials-marquee","location-hours","faq-accordion","cta-banner","contact-form"],
    ["hero-glow","feature-split","menu-list","team-cards","testimonial-quote","location-hours","contact-form"],
  ],
  b2b: [
    ["hero-center","logos-strip","feature-split","stats-band","pricing-trio","testimonials-marquee","cta-banner","contact-form"],
    ["hero-glow","logos-strip","features-bento","steps-process","stats-band","team-cards","pricing-trio","faq-accordion","testimonials-marquee","cta-banner","contact-form"],
    ["hero-product","feature-split","services-grid","stats-band","pricing-duo","testimonial-quote","cta-banner","contact-form"],
  ],
  saas: [
    ["hero-glow","logos-strip","features-bento","feature-split","pricing-trio","testimonials-marquee","faq-accordion","cta-banner","contact-form"],
    ["hero-product","logos-strip","features-bento","stats-band","steps-process","pricing-trio","testimonials-marquee","faq-accordion","cta-banner","contact-form"],
    ["hero-center","features-bento","feature-split","stats-band","pricing-duo","testimonial-quote","cta-banner","contact-form"],
  ],
  portfolio: [
    ["hero-center","gallery-grid","feature-split","stats-band","testimonial-quote","cta-banner","contact-form"],
    ["hero-glow","gallery-grid","services-grid","team-cards","stats-band","testimonials-marquee","cta-banner","contact-form"],
    ["hero-product","gallery-grid","feature-split","services-grid","testimonial-quote","contact-form"],
  ],
  store: [
    ["hero-glow","gallery-grid","features-bento","feature-split","testimonials-marquee","cta-banner","contact-form"],
    ["hero-product","logos-strip","gallery-grid","features-bento","stats-band","testimonials-marquee","faq-accordion","cta-banner","contact-form"],
    ["hero-split","gallery-grid","feature-split","services-grid","testimonial-quote","contact-form"],
  ],
  realestate: [
    ["hero-glow","stats-band","listings-grid","steps-process","faq-accordion","cta-banner","contact-form"],
    ["hero-split","listings-grid","feature-split","stats-band","team-cards","testimonials-marquee","location-hours","faq-accordion","cta-banner","contact-form"],
    ["hero-product","listings-grid","steps-process","feature-split","testimonial-quote","location-hours","contact-form"],
  ],
  hospitality: [
    ["hero-glow","gallery-grid","feature-split","stats-band","testimonial-quote","location-hours","cta-banner","contact-form"],
    ["hero-split","gallery-grid","features-bento","stats-band","testimonials-marquee","location-hours","faq-accordion","cta-banner","contact-form"],
    ["hero-glow","gallery-grid","services-grid","stats-band","testimonial-quote","location-hours","contact-form"],
  ],
  creator: [
    ["hero-center","stats-band","feature-split","gallery-grid","testimonial-quote","pricing-trio","cta-banner","contact-form"],
    ["hero-glow","gallery-grid","stats-band","feature-split","testimonials-marquee","pricing-duo","faq-accordion","cta-banner","contact-form"],
    ["hero-product","gallery-grid","feature-split","testimonial-quote","contact-form"],
  ],
  edu: [
    ["hero-glow","features-bento","steps-process","pricing-trio","testimonials-marquee","faq-accordion","cta-banner","contact-form"],
    ["hero-split","logos-strip","features-bento","steps-process","team-cards","stats-band","pricing-trio","testimonials-marquee","faq-accordion","cta-banner","contact-form"],
    ["hero-product","features-bento","steps-process","services-grid","pricing-duo","testimonial-quote","contact-form"],
  ],
};

// Navs disponibles para industrias (todos con marca de TEXTO — el logo de Multiatlas queda en la landing).
const NAVS = ["nav-simple", "nav-center", "nav-sidebar", "nav-split"];

// Pool de animaciones de entrada por sección.
const ANIMS_MOVE = ["up","rise","left","right","zoom","blur"];
function animFor(slug, r, i) {
  if (/^hero/.test(slug)) return pickR(r, ["up","zoom","blur"]);
  if (/(grid|bento|gallery|marquee|listings|menu|team|logos|stats)/.test(slug)) return "stagger";
  if (slug === "feature-split") return (i % 2 === 0) ? "left" : "right";
  return pickR(r, ANIMS_MOVE);
}

// ─────────────────────────────────────────────────────── Tipografía por arquetipo (fallback si no hay industry-fonts)
const FONTS = {
  food:{d:"'Playfair Display', serif"}, portfolio:{d:"'Playfair Display', serif"}, hospitality:{d:"'Playfair Display', serif"},
  realestate:{d:"'Playfair Display', serif"}, saas:{d:"'Space Grotesk', sans-serif"}, store:{d:"'Space Grotesk', sans-serif"},
  creator:{d:"'Space Grotesk', sans-serif"}, b2b:{d:"'Archivo', sans-serif"}, edu:{d:"'Archivo', sans-serif"}, local:{d:"'Archivo', sans-serif"},
};

const HERO = {
  local:(n)=>({eyebrow:`${n} · atención de primera`,h1:"Cuidamos lo que",em:"más importa",h2:"para ti",sub:`${n}: servicio cercano, profesional y con resultados que se notan. Primera cita sin compromiso.`}),
  food:(n)=>({eyebrow:`${n} · con alma`,h1:"Sabor que",em:"enamora",h2:"en cada visita",sub:`En ${n} cuidamos cada ingrediente y cada detalle. Reserva tu mesa y déjate sorprender.`}),
  b2b:(n)=>({eyebrow:`${n} · resultados medibles`,h1:"Impulsa tu negocio",em:"con",h2:"quien sabe",sub:`${n} te acompaña con estrategia y ejecución. Menos promesas, más resultados.`}),
  saas:(n)=>({eyebrow:`${n} · hecho para escalar`,h1:"Haz más,",em:"en",h2:"menos tiempo",sub:`${n} automatiza lo tedioso para que tu equipo se enfoque en lo que importa. Pruébalo gratis.`}),
  portfolio:(n)=>({eyebrow:`${n} · trabajo con criterio`,h1:"Ideas que",em:"se ven",h2:"y se recuerdan",sub:`${n}: un portafolio de trabajo real. Si buscas nivel, hablemos de tu proyecto.`}),
  store:(n)=>({eyebrow:`${n} · hecho para ti`,h1:"Lo que amas,",em:"a un",h2:"clic",sub:`Descubre ${n}. Envíos a todo el país y cambios sin complicaciones.`}),
  realestate:(n)=>({eyebrow:`${n} · patrimonio con criterio`,h1:"Propiedades que",em:"definen",h2:"cómo vives",sub:`${n}: selección curada en las mejores zonas, con asesoría de principio a fin.`}),
  hospitality:(n)=>({eyebrow:`${n} · una experiencia`,h1:"Vive una",em:"estancia",h2:"inolvidable",sub:`${n} te espera. Reserva directo y obtén la mejor tarifa.`}),
  creator:(n)=>({eyebrow:`${n}`,h1:"Contenido que",em:"conecta",h2:"de verdad",sub:`${n}: proyectos, comunidad y colaboraciones, todo en un lugar.`}),
  edu:(n)=>({eyebrow:`${n} · aprende haciendo`,h1:"Aprende algo",em:"que sí",h2:"cambia tu vida",sub:`${n}: programas prácticos, mentores reales y una comunidad que te empuja.`}),
};

// Formulario PERSONALIZADO por giro (cada template tiene el suyo; el de Multiatlas queda solo en la landing).
const FORM = {
  local:      { eyebrow:"Agenda",     head:"Reserva tu cita en",       b:["Primera consulta sin compromiso","Atención personalizada","Confirmación el mismo día"], opts:["Agendar cita","Consulta de precios","Urgencia","Información general","Otro"] },
  food:       { eyebrow:"Reservas",   head:"Reserva tu mesa en",       b:["Confirmación el mismo día","Grupos y eventos privados","Menús especiales"],           opts:["Reservar mesa","Evento privado","Menú y precios","Pedido para llevar","Otro"] },
  saas:       { eyebrow:"Demo",       head:"Solicita una demo de",     b:["Demo personalizada","Onboarding incluido","Soporte dedicado"],                        opts:["Solicitar demo","Hablar con ventas","Soporte técnico","Planes y precios","Otro"] },
  b2b:        { eyebrow:"Hablemos",   head:"Cuéntanos tu proyecto —",   b:["Diagnóstico inicial sin costo","Propuesta a la medida","Respuesta en menos de 24h"],  opts:["Solicitar propuesta","Agendar llamada","Cotización","Información de servicios","Otro"] },
  store:      { eyebrow:"Atención",   head:"¿Dudas con tu compra? —",   b:["Envíos a todo el país","Cambios sin complicaciones","Atención personalizada"],          opts:["Consulta de producto","Estado de mi pedido","Cambios y devoluciones","Ventas al mayoreo","Otro"] },
  portfolio:  { eyebrow:"Contacto",   head:"Trabajemos juntos —",       b:["Respuesta personal","Presupuesto claro","Trabajo a la medida"],                        opts:["Cotizar un proyecto","Colaboración","Ver portafolio completo","Consulta general","Otro"] },
  creator:    { eyebrow:"Conecta",    head:"Conecta con",              b:["Respuesta directa","Media kit disponible","Colaboraciones abiertas"],                 opts:["Colaboraciones / marcas","Contrataciones","Prensa","Comunidad","Otro"] },
  realestate: { eyebrow:"Asesoría",   head:"Agenda tu asesoría —",      b:["Asesoría sin costo","Recorridos privados","Acompañamiento legal"],                     opts:["Quiero comprar","Quiero vender","Rentar","Solicitar valuación","Otro"] },
  hospitality:{ eyebrow:"Reservas",   head:"Reserva en",               b:["Mejor tarifa directa","Atención 24/7","Experiencias a la medida"],                    opts:["Reservar","Consultar disponibilidad","Eventos","Tarifas","Otro"] },
  edu:        { eyebrow:"Inscríbete", head:"Inscríbete en",            b:["Asesoría educativa","Certificación al terminar","Mentores reales"],                    opts:["Información del programa","Inscripción","Becas y pagos","Fechas y horarios","Otro"] },
};
function brandSlug(n){ return String(n||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"").slice(0,16) || "negocio"; }

// ─────────────────────────────────────────────────────── Pools de contenido para secciones REPETIBLES
// (el nº de items varía por semilla → cada industria tiene distinta cantidad de tarjetas/preguntas/etc.)
const SERVICES_POOL = [
  { icon:"◈", title:"Atención personalizada", desc:"Cada cliente recibe una solución hecha a su medida, no una plantilla.", price:"A tu medida" },
  { icon:"✦", title:"Calidad garantizada", desc:"Trabajo cuidado de principio a fin, con revisión en cada etapa.", price:"Incluido" },
  { icon:"◐", title:"Respuesta rápida", desc:"Te contestamos el mismo día y avanzamos sin demoras.", price:"24–48 h" },
  { icon:"▣", title:"Precios claros", desc:"Sabes cuánto pagas desde el inicio, sin sorpresas al final.", price:"Sin letras chicas" },
  { icon:"◎", title:"Acompañamiento", desc:"Te guiamos en cada decisión hasta lograr el resultado.", price:"Siempre" },
  { icon:"✚", title:"Experiencia comprobada", desc:"Años resolviendo casos como el tuyo, con resultados reales.", price:"+10 años" },
];
const FAQS_POOL = [
  { q:"¿Cómo empiezo?", a:"Muy fácil: escríbenos por el formulario o WhatsApp y te respondemos el mismo día para agendar el primer paso." },
  { q:"¿Cuánto cuesta?", a:"Depende de lo que necesites. Te damos una cotización clara y por escrito antes de comenzar, sin costos ocultos." },
  { q:"¿Atienden mi zona?", a:"Cubrimos varias zonas y también ofrecemos atención remota. Cuéntanos tu ubicación y lo confirmamos al momento." },
  { q:"¿Cuánto tardan?", a:"Los tiempos dependen del proyecto, pero siempre te damos una fecha estimada realista desde el inicio." },
  { q:"¿Ofrecen garantía?", a:"Sí. Respaldamos nuestro trabajo y te acompañamos después de la entrega si surge cualquier duda." },
];
const STEPS_POOL = [
  { title:"Cuéntanos", desc:"Nos dices qué necesitas y en cuánto tiempo lo quieres." },
  { title:"Te proponemos", desc:"Diseñamos la solución a tu medida y te la presentamos sin compromiso." },
  { title:"Lo ejecutamos", desc:"Manos a la obra, con avances claros y comunicación constante." },
  { title:"Lo entregamos", desc:"Recibes el resultado listo, con acompañamiento posterior." },
];
const STATS_POOL = [
  { n:"20", suf:"años", label:"de experiencia" },
  { n:"1.2", suf:"k+", label:"clientes atendidos" },
  { n:"98", suf:"%", label:"clientes satisfechos" },
  { n:"24", suf:"h", label:"tiempo de respuesta" },
  { n:"15", suf:"+", label:"zonas cubiertas" },
];
const TESTIS_POOL = [
  { quote:"El resultado superó lo que esperábamos. Rápido, claro y muy profesional.", name:"Laura G.", role:"Clienta" },
  { quote:"Atención impecable de principio a fin. Volvería sin dudarlo.", name:"Marco R.", role:"Cliente" },
  { quote:"Justo lo que necesitaba, sin complicaciones y con excelente trato.", name:"Sofía M.", role:"Clienta" },
  { quote:"Cumplieron todo lo prometido y más. Totalmente recomendados.", name:"Andrés P.", role:"Cliente" },
  { quote:"Profesionales, puntuales y con un resultado que habla por sí solo.", name:"Daniela V.", role:"Clienta" },
];
const LOGOS_POOL = ["Aurora","Vértice","Nodo","Kairós","Ébano","Prisma","Cúspide","Orión"];
const MEMBERS_POOL = [
  { ini:"MG", name:"María González", role:"Dirección", cred:"Al frente del equipo" },
  { ini:"JR", name:"Jorge Ramírez", role:"Operaciones", cred:"Especialista senior" },
  { ini:"AL", name:"Ana López", role:"Atención a clientes", cred:"Tu primer contacto" },
  { ini:"CD", name:"Carlos Díaz", role:"Calidad", cred:"Revisa cada entrega" },
];
const MENU_ENTRADAS = [
  { name:"Especialidad de la casa", desc:"Nuestra receta insignia.", price:"$185" },
  { name:"Del día", desc:"Fresco, según temporada.", price:"$150" },
  { name:"Para compartir", desc:"Ideal para la mesa.", price:"$220" },
  { name:"Ligero", desc:"Opción fresca y balanceada.", price:"$130" },
];
const MENU_PRINCIPALES = [
  { name:"Plato fuerte estrella", desc:"El favorito de siempre.", price:"$320" },
  { name:"Selección del chef", desc:"Recomendación de la casa.", price:"$360" },
  { name:"Clásico", desc:"Como debe ser, sin atajos.", price:"$290" },
  { name:"Vegetariano", desc:"Sabor pleno, sin carne.", price:"$240" },
];
const LISTINGS_POOL = [
  { zona:"Centro", precio:"$3.8 M", titulo:"Departamento con terraza", rec:"2", ban:"2", m2:"95" },
  { zona:"Norte", precio:"$5.2 M", titulo:"Casa con jardín", rec:"3", ban:"3", m2:"210" },
  { zona:"Poniente", precio:"$7.9 M", titulo:"Residencia premium", rec:"4", ban:"4", m2:"320" },
  { zona:"Sur", precio:"$2.6 M", titulo:"Loft moderno", rec:"1", ban:"1", m2:"68" },
  { zona:"Lomas", precio:"$9.4 M", titulo:"Penthouse con vista", rec:"3", ban:"3", m2:"180" },
  { zona:"Valle", precio:"$4.1 M", titulo:"Townhouse familiar", rec:"3", ban:"2", m2:"150" },
];

const FEATURES_POOL = [
  { icon:"◈", title:"Hecho a tu medida", desc:"Cada detalle pensado para ti, no una plantilla." },
  { icon:"⚡", title:"Rápido", desc:"Resultados en tiempo récord, sin sacrificar calidad." },
  { icon:"◐", title:"Tu identidad", desc:"Colores, tono y estilo coherentes con tu marca." },
  { icon:"▣", title:"Sin sorpresas", desc:"Precios y tiempos claros desde el primer día." },
  { icon:"✦", title:"Calidad constante", desc:"Revisado con cuidado antes de cada entrega." },
  { icon:"◎", title:"Acompañamiento", desc:"No te dejamos solo después de entregar." },
];

// Contenido ESPECÍFICO por giro (arquetipo). poolFor cae a los pools genéricos cuando no hay variante.
const POOLS_BYARCH = {
  services: {
    local: [
      { icon:"◈", title:"Atención cercana", desc:"Te tratamos por tu nombre, no por número de folio.", price:"Personalizado" },
      { icon:"◐", title:"Diagnóstico honesto", desc:"Te decimos lo que necesitas, no lo que más nos conviene.", price:"Sin costo" },
      { icon:"✦", title:"Trabajo garantizado", desc:"Si algo no queda bien, lo resolvemos sin cobrarte de más.", price:"Con garantía" },
      { icon:"▣", title:"Precios justos", desc:"Tarifas claras, acordadas antes de empezar.", price:"Sin sorpresas" },
      { icon:"◎", title:"Disponibilidad", desc:"Agenda flexible y respuesta el mismo día.", price:"Rápido" },
      { icon:"✚", title:"Años de oficio", desc:"Experiencia real resolviendo casos como el tuyo.", price:"+10 años" },
    ],
    b2b: [
      { icon:"◈", title:"Consultoría estratégica", desc:"Diagnóstico y hoja de ruta accionable para tu operación.", price:"A medida" },
      { icon:"◐", title:"Implementación", desc:"Ejecutamos, no solo asesoramos. Resultados medibles.", price:"Por proyecto" },
      { icon:"✦", title:"Optimización de procesos", desc:"Menos fricción, más margen.", price:"Continuo" },
      { icon:"▣", title:"Reportes ejecutivos", desc:"Datos claros para decidir con confianza.", price:"Mensual" },
      { icon:"◎", title:"Soporte dedicado", desc:"Un equipo asignado que conoce tu negocio.", price:"Incluido" },
      { icon:"▲", title:"Escalabilidad", desc:"Crecemos contigo, sin rehacer todo.", price:"Flexible" },
    ],
    store: [
      { icon:"◈", title:"Envío a todo el país", desc:"Tu pedido llega a donde estés.", price:"2–5 días" },
      { icon:"◐", title:"Cambios sencillos", desc:"30 días para cambios sin complicaciones.", price:"Sin costo" },
      { icon:"✦", title:"Pago seguro", desc:"Múltiples métodos, cifrado de extremo a extremo.", price:"Protegido" },
      { icon:"▣", title:"Atención real", desc:"Personas que te responden, no bots.", price:"24/7" },
      { icon:"◎", title:"Programa de puntos", desc:"Cada compra suma para la siguiente.", price:"Gratis" },
      { icon:"✚", title:"Garantía de producto", desc:"Respaldo directo con el fabricante.", price:"Incluida" },
    ],
    portfolio: [
      { icon:"◈", title:"Diseño a la medida", desc:"Cada proyecto parte de cero, para ti.", price:"Personalizado" },
      { icon:"◐", title:"Dirección de arte", desc:"Una estética coherente y memorable.", price:"Incluido" },
      { icon:"✦", title:"Entrega puntual", desc:"Cumplimos fechas, sin excusas.", price:"Garantizado" },
      { icon:"▣", title:"Archivos editables", desc:"Te entrego todo, sin candados.", price:"Sin lock-in" },
      { icon:"◎", title:"Revisiones", desc:"Ajustamos hasta que te enamore.", price:"Hasta 3 rondas" },
      { icon:"✚", title:"Acompañamiento", desc:"Te asesoro más allá de la entrega.", price:"Post-proyecto" },
    ],
    edu: [
      { icon:"◈", title:"Programa práctico", desc:"Aprendes haciendo, desde la primera clase.", price:"Aplicado" },
      { icon:"◐", title:"Mentores reales", desc:"Profesionales en activo, no solo teoría.", price:"Incluido" },
      { icon:"✦", title:"Certificación", desc:"Un aval que suma a tu perfil.", price:"Al terminar" },
      { icon:"▣", title:"A tu ritmo", desc:"Contenido de por vida, avanzas cuando puedes.", price:"Flexible" },
      { icon:"◎", title:"Comunidad", desc:"Una red que te empuja y te acompaña.", price:"Activa" },
      { icon:"✚", title:"Becas y planes", desc:"Opciones para que el costo no te frene.", price:"Disponibles" },
    ],
    hospitality: [
      { icon:"◈", title:"Mejor tarifa directa", desc:"Reserva sin intermediarios y ahorra.", price:"Garantizada" },
      { icon:"◐", title:"Atención 24/7", desc:"Estamos para ti a cualquier hora.", price:"Siempre" },
      { icon:"✦", title:"Experiencias", desc:"Momentos diseñados para recordarse.", price:"A medida" },
      { icon:"▣", title:"Ubicación privilegiada", desc:"Cerca de todo lo que importa.", price:"Céntrico" },
      { icon:"◎", title:"Amenidades", desc:"Todo lo que necesitas, incluido.", price:"Sin extras" },
      { icon:"✚", title:"Cancelación flexible", desc:"Planes que se adaptan a ti.", price:"Sin penalización" },
    ],
  },
  features: {
    saas: [
      { icon:"⚡", title:"Automatización", desc:"Elimina tareas repetitivas y recupera horas cada semana." },
      { icon:"◈", title:"Integraciones", desc:"Conecta las herramientas que ya usas, en minutos." },
      { icon:"◐", title:"Analítica en vivo", desc:"Métricas claras para decidir con datos." },
      { icon:"▣", title:"Seguridad", desc:"Cifrado y control de accesos de nivel empresarial." },
      { icon:"✦", title:"Colaboración", desc:"Tu equipo, sincronizado en tiempo real." },
      { icon:"◎", title:"API abierta", desc:"Extiende y personaliza sin límites." },
    ],
    b2b: [
      { icon:"◈", title:"Resultados medibles", desc:"KPIs claros desde el primer mes." },
      { icon:"◐", title:"Equipo senior", desc:"Gente con oficio, no becarios." },
      { icon:"✦", title:"Metodología probada", desc:"Un proceso que ya funcionó en decenas de casos." },
      { icon:"▣", title:"Confidencialidad", desc:"Tu información, blindada." },
      { icon:"◎", title:"Reportes ejecutivos", desc:"Claridad para tomar decisiones." },
      { icon:"▲", title:"Escalable", desc:"Soluciones que crecen contigo." },
    ],
    store: [
      { icon:"◈", title:"Catálogo curado", desc:"Solo lo bueno, seleccionado a mano." },
      { icon:"◐", title:"Envío rápido", desc:"A tu puerta en pocos días." },
      { icon:"✦", title:"Calidad garantizada", desc:"Respaldo directo con cada producto." },
      { icon:"▣", title:"Pago seguro", desc:"Compra con tranquilidad." },
      { icon:"◎", title:"Novedades constantes", desc:"Siempre algo nuevo que descubrir." },
      { icon:"✚", title:"Atención humana", desc:"Personas reales resolviendo tus dudas." },
    ],
    edu: [
      { icon:"◈", title:"Aprende haciendo", desc:"Proyectos reales desde el día uno." },
      { icon:"◐", title:"Mentores en activo", desc:"Aprende de quien lo vive a diario." },
      { icon:"✦", title:"Certificación", desc:"Un aval que abre puertas." },
      { icon:"▣", title:"A tu ritmo", desc:"Acceso de por vida, sin presiones." },
      { icon:"◎", title:"Comunidad", desc:"Una red que te acompaña." },
      { icon:"✚", title:"Soporte cercano", desc:"Nunca te quedas con una duda." },
    ],
  },
  faqs: {
    food: [
      { q:"¿Necesito reservación?", a:"Recomendamos reservar, sobre todo en fin de semana. Puedes hacerlo por el formulario o WhatsApp." },
      { q:"¿Tienen opciones vegetarianas?", a:"Sí, contamos con platillos vegetarianos y podemos adaptar varios a tus preferencias." },
      { q:"¿Hacen eventos privados?", a:"Claro. Organizamos comidas, cenas y celebraciones. Cuéntanos tu idea y la cotizamos." },
      { q:"¿Tienen servicio para llevar?", a:"Sí, puedes ordenar para llevar o a domicilio en zonas cercanas." },
      { q:"¿Cuál es el horario?", a:"Abrimos todos los días; consulta el horario del día en la sección de ubicación." },
    ],
    saas: [
      { q:"¿Necesito tarjeta para probar?", a:"No. Puedes empezar gratis y sin tarjeta; solo pagas si decides continuar." },
      { q:"¿Se integra con mis herramientas?", a:"Sí, conectamos con las apps más usadas y ofrecemos API abierta para lo demás." },
      { q:"¿Mis datos están seguros?", a:"Usamos cifrado y control de accesos de nivel empresarial. Tus datos son tuyos." },
      { q:"¿Puedo cancelar cuando quiera?", a:"Sí, sin permanencia ni penalizaciones. Cancelas con un clic." },
      { q:"¿Ofrecen soporte?", a:"Soporte dedicado por chat y correo, con tiempos de respuesta rápidos." },
    ],
    b2b: [
      { q:"¿Cómo empezamos a trabajar juntos?", a:"Agendamos un diagnóstico inicial sin costo para entender tu operación y objetivos." },
      { q:"¿Manejan proyectos a medida?", a:"Sí. Cada propuesta se diseña según tu contexto, no usamos recetas genéricas." },
      { q:"¿Cómo miden resultados?", a:"Definimos KPIs desde el inicio y entregamos reportes ejecutivos periódicos." },
      { q:"¿Firman confidencialidad?", a:"Por supuesto. Trabajamos bajo acuerdos de confidencialidad siempre." },
    ],
    store: [
      { q:"¿Cuánto tarda el envío?", a:"Entre 2 y 5 días hábiles según tu zona. Te damos seguimiento en todo momento." },
      { q:"¿Puedo cambiar o devolver?", a:"Sí, tienes 30 días para cambios y devoluciones sin complicaciones." },
      { q:"¿Qué métodos de pago aceptan?", a:"Tarjetas, transferencia y pagos en línea, todos con conexión segura." },
      { q:"¿Los productos tienen garantía?", a:"Sí, todos cuentan con garantía y respaldo directo." },
    ],
    realestate: [
      { q:"¿Cobran por asesoría?", a:"La asesoría inicial es sin costo. Te acompañamos para que decidas con información." },
      { q:"¿Ayudan con el trámite legal?", a:"Sí, te acompañamos en la revisión legal y el proceso hasta la firma." },
      { q:"¿Puedo agendar un recorrido?", a:"Claro, coordinamos visitas privadas en el horario que te acomode." },
      { q:"¿Manejan crédito hipotecario?", a:"Te orientamos con las opciones de financiamiento y los requisitos." },
    ],
    hospitality: [
      { q:"¿Cuál es el horario de check-in?", a:"El check-in es por la tarde y el check-out al mediodía, con flexibilidad según disponibilidad." },
      { q:"¿La reserva directa es más barata?", a:"Sí, reservando directo obtienes la mejor tarifa garantizada." },
      { q:"¿Puedo cancelar sin costo?", a:"Contamos con tarifas de cancelación flexible; revisa las condiciones al reservar." },
      { q:"¿Tienen estacionamiento?", a:"Sí, y otras amenidades incluidas. Consúltanos lo que necesites." },
    ],
    edu: [
      { q:"¿Necesito conocimientos previos?", a:"No para los programas base. Cada curso indica su nivel recomendado." },
      { q:"¿El certificado tiene valor?", a:"Sí, es un aval que puedes sumar a tu CV y perfil profesional." },
      { q:"¿Puedo estudiar a mi ritmo?", a:"Sí, tienes acceso de por vida y avanzas cuando puedas." },
      { q:"¿Hay becas o facilidades?", a:"Ofrecemos planes de pago y becas parciales; escríbenos para conocerlas." },
    ],
    local: [
      { q:"¿Necesito cita?", a:"Recomendamos agendar para atenderte mejor, aunque también recibimos sin cita según disponibilidad." },
      { q:"¿La primera consulta tiene costo?", a:"La valoración inicial es sin compromiso. Te explicamos todo antes de cobrar." },
      { q:"¿Atienden a domicilio?", a:"Sí, según el servicio y tu ubicación. Consúltanos y lo confirmamos." },
      { q:"¿Qué formas de pago aceptan?", a:"Efectivo, tarjeta y transferencia. Te damos comprobante siempre." },
    ],
  },
  stats: {
    food: [ { n:"12", suf:"años", label:"cocinando" }, { n:"40", suf:"+", label:"platillos" }, { n:"4.8", suf:"★", label:"en reseñas" }, { n:"200", suf:"+", label:"comensales/semana" } ],
    saas: [ { n:"99.9", suf:"%", label:"de disponibilidad" }, { n:"10", suf:"k+", label:"usuarios activos" }, { n:"4.9", suf:"★", label:"valoración" }, { n:"24/7", suf:"", label:"soporte" } ],
    b2b: [ { n:"450", suf:"+", label:"proyectos" }, { n:"98", suf:"%", label:"retención" }, { n:"12", suf:"", label:"industrias" }, { n:"35", suf:"%", label:"ROI promedio" } ],
    store: [ { n:"50", suf:"k+", label:"pedidos enviados" }, { n:"4.8", suf:"★", label:"reseñas" }, { n:"48", suf:"h", label:"para envío" }, { n:"30", suf:" días", label:"para cambios" } ],
    realestate: [ { n:"320", suf:"", label:"propiedades" }, { n:"18", suf:"años", label:"en el mercado" }, { n:"95", suf:"%", label:"cierres exitosos" }, { n:"12", suf:"", label:"zonas" } ],
    hospitality: [ { n:"4.8", suf:"★", label:"de huéspedes" }, { n:"96", suf:"%", label:"recomiendan" }, { n:"24/7", suf:"", label:"recepción" }, { n:"15", suf:"años", label:"de servicio" } ],
    edu: [ { n:"8", suf:"k+", label:"egresados" }, { n:"92", suf:"%", label:"empleabilidad" }, { n:"4.9", suf:"★", label:"valoración" }, { n:"120", suf:"+", label:"cursos" } ],
  },
  testis: {
    food: [
      { quote:"La mejor experiencia gastronómica en mucho tiempo. Volvimos al día siguiente.", name:"Laura G.", role:"Comensal" },
      { quote:"Sabor, presentación y trato impecables. Reservamos para toda la familia.", name:"Marco R.", role:"Cliente frecuente" },
      { quote:"Cada platillo es una sorpresa. El chef sabe lo que hace.", name:"Sofía M.", role:"Foodie" },
      { quote:"Ambiente perfecto y atención de otro nivel. Recomendadísimo.", name:"Andrés P.", role:"Comensal" },
    ],
    saas: [
      { quote:"Nos ahorró horas cada semana. El equipo por fin se enfoca en lo importante.", name:"Laura G.", role:"Ops Manager" },
      { quote:"La integración fue en minutos y el soporte respondió al instante.", name:"Marco R.", role:"CTO" },
      { quote:"Métricas claras y decisiones más rápidas. Justo lo que buscábamos.", name:"Sofía M.", role:"Head of Growth" },
      { quote:"Escalamos sin dolores de cabeza. Se nota el trabajo detrás.", name:"Andrés P.", role:"Founder" },
    ],
    b2b: [
      { quote:"Resultados medibles desde el primer trimestre. Sin humo.", name:"Laura G.", role:"Directora comercial" },
      { quote:"Un socio estratégico, no un proveedor más. Recomendados.", name:"Marco R.", role:"CEO" },
      { quote:"Ejecución impecable y reportes claros para el board.", name:"Sofía M.", role:"COO" },
      { quote:"Entendieron nuestro negocio y entregaron valor real.", name:"Andrés P.", role:"Director de operaciones" },
    ],
    store: [
      { quote:"Llegó rápido y tal cual la foto. Repetiré sin duda.", name:"Laura G.", role:"Clienta" },
      { quote:"El cambio fue facilísimo, sin preguntas. Excelente servicio.", name:"Marco R.", role:"Cliente" },
      { quote:"Calidad real por el precio. Ya es mi tienda de cabecera.", name:"Sofía M.", role:"Clienta frecuente" },
      { quote:"Atención humana y cercana. Se agradece en estos tiempos.", name:"Andrés P.", role:"Cliente" },
    ],
    realestate: [
      { quote:"Nos acompañaron en cada paso hasta las llaves. Cero estrés.", name:"Laura G.", role:"Compradora" },
      { quote:"Vendí más rápido y mejor de lo que esperaba. Muy profesionales.", name:"Marco R.", role:"Vendedor" },
      { quote:"Asesoría honesta y transparente. Confianza total.", name:"Sofía M.", role:"Inversionista" },
      { quote:"Encontraron justo lo que buscábamos, en la zona ideal.", name:"Andrés P.", role:"Comprador" },
    ],
    hospitality: [
      { quote:"Una estancia de ensueño. Cada detalle cuidado al máximo.", name:"Laura G.", role:"Huésped" },
      { quote:"Atención cálida y ubicación perfecta. Volveremos seguro.", name:"Marco R.", role:"Huésped" },
      { quote:"La experiencia superó nuestras expectativas por mucho.", name:"Sofía M.", role:"Viajera" },
      { quote:"Reservar directo valió la pena. Mejor tarifa y mejor trato.", name:"Andrés P.", role:"Huésped" },
    ],
    edu: [
      { quote:"Aprendí más en semanas que en años. Práctico de verdad.", name:"Laura G.", role:"Egresada" },
      { quote:"Los mentores marcan la diferencia. Conseguí trabajo al terminar.", name:"Marco R.", role:"Egresado" },
      { quote:"A mi ritmo y con una comunidad que te empuja. Increíble.", name:"Sofía M.", role:"Estudiante" },
      { quote:"Contenido actual y aplicable desde el primer día.", name:"Andrés P.", role:"Egresado" },
    ],
  },
  steps: {
    saas: [
      { title:"Regístrate", desc:"Crea tu cuenta en segundos, sin tarjeta." },
      { title:"Conecta", desc:"Integra tus herramientas en minutos." },
      { title:"Automatiza", desc:"Deja que el sistema trabaje por ti." },
      { title:"Escala", desc:"Crece sin fricción, con datos a la mano." },
    ],
    b2b: [
      { title:"Diagnóstico", desc:"Entendemos tu operación y tus metas." },
      { title:"Propuesta", desc:"Diseñamos un plan a la medida." },
      { title:"Ejecución", desc:"Implementamos con avances claros." },
      { title:"Optimización", desc:"Medimos y mejoramos continuamente." },
    ],
    realestate: [
      { title:"Cuéntanos qué buscas", desc:"Zona, presupuesto y necesidades." },
      { title:"Selección curada", desc:"Te mostramos solo lo que encaja." },
      { title:"Recorridos", desc:"Visitas privadas sin presión." },
      { title:"Cierre acompañado", desc:"Te guiamos hasta las llaves." },
    ],
    edu: [
      { title:"Inscríbete", desc:"Elige tu programa y asegura tu lugar." },
      { title:"Aprende haciendo", desc:"Proyectos reales desde el inicio." },
      { title:"Recibe mentoría", desc:"Acompañamiento de profesionales." },
      { title:"Certifícate", desc:"Obtén tu aval y llévalo a tu CV." },
    ],
  },
};
const GENERIC = { services: SERVICES_POOL, features: FEATURES_POOL, faqs: FAQS_POOL, stats: STATS_POOL, testis: TESTIS_POOL, steps: STEPS_POOL };
function poolFor(type, arch) { const t = POOLS_BYARCH[type]; return (t && t[arch]) || GENERIC[type] || []; }

// Patrones de columnas del bento (suman múltiplos de 6 para teselar limpio a cualquier nº).
const BENTO_SPANS = { 3: ["2","2","2"], 4: ["4","2","2","4"], 5: ["4","2","2","2","2"], 6: ["4","2","2","2","2","6"] };

// Devuelve los arrays de items (con nº variable por semilla) para las secciones repetibles.
function itemsFor(slug, ind, r) {
  const arch = ind.arch;
  const cnt = (min, max) => min + Math.floor(r() * (max - min + 1));
  const rot = (pool, k) => { const start = Math.floor(r() * pool.length); const out = []; for (let x = 0; x < k; x++) out.push(pool[(start + x) % pool.length]); return out; };
  switch (slug) {
    case "services-grid":         return { services: rot(poolFor("services", arch), cnt(3, 6)) };
    case "features-bento":        { const k = cnt(3, 6); const spans = BENTO_SPANS[k]; return { features: rot(poolFor("features", arch), k).map((it, i) => Object.assign({}, it, { span: spans[i] })) }; }
    case "logos-strip":           return { logos: rot(LOGOS_POOL, cnt(4, 8)).map(name => ({ name })) };
    case "team-cards":            return { members: rot(MEMBERS_POOL, cnt(3, 4)) };
    case "testimonials-marquee":  return { testis: rot(poolFor("testis", arch), cnt(3, 5)) };
    case "faq-accordion":         return { faqs: rot(poolFor("faqs", arch), cnt(3, 5)) };
    case "steps-process":         { const k = cnt(3, 4); return { steps: rot(poolFor("steps", arch), k).map((it, i) => ({ num: String(i + 1).padStart(2, "0"), title: it.title, desc: it.desc })) }; }
    case "stats-band":            return { stats: rot(poolFor("stats", arch), cnt(3, 4)) };
    case "menu-list":             return { cat1items: rot(MENU_ENTRADAS, cnt(2, 4)), cat2items: rot(MENU_PRINCIPALES, cnt(2, 4)) };
    case "listings-grid":         { const k = cnt(3, 6); return { listings: rot(LISTINGS_POOL, k).map((it, i) => Object.assign({}, it, { img: pick("inmob", i) })) }; }
    case "gallery-grid":          { const k = cnt(3, 6); const arr = []; for (let x = 0; x < k; x++) arr.push({ img: pick(ind.fam, x), title: "Proyecto " + String(x + 1).padStart(2, "0"), tag: "Trabajo reciente" }); return { items: arr }; }
    default:                      return {};
  }
}

function copyFor(slug, ind) {
  const n = ind.label, arch = ind.arch, h = HERO[arch](n), i = ind.i || 0, fam = ind.fam;
  const img = pick(fam, i);
  switch (slug) {
    case "hero-glow": return { eyebrow:h.eyebrow, headline_1:h.h1, headline_em:h.em, headline_2:h.h2, sub:h.sub, cta:"Empezar", cta_href:"#contacto", cta2:"Conocer más", cta2_href:"#features", bg_img:img };
    case "hero-split": return { eyebrow:h.eyebrow, headline_1:h.h1, headline_em:h.em, headline_2:h.h2, sub:h.sub, cta:"Empezar", cta_href:"#contacto", cta2:"Conocer más", cta2_href:"#features", img };
    case "hero-center": return { eyebrow:h.eyebrow, headline_1:h.h1, headline_em:h.em, headline_2:h.h2, sub:h.sub, cta:"Empezar", cta_href:"#contacto", cta2:"Conocer más", cta2_href:"#features" };
    case "hero-product": return { eyebrow:h.eyebrow, headline:`${h.h1} ${h.em} ${h.h2}`, sub:h.sub, cta:"Empezar", cta_href:"#contacto", mock_title:`${brandSlug(n)}.site`, mock_line1:"▸ Preparando tu experiencia…", mock_line2:`▸ ${n} a un paso`, mock_line3:"✓ Todo listo para empezar" };
    case "services-grid": return { eyebrow:"Lo que hacemos", headline:`Servicios de ${n}`, sub:"Todo lo que necesitas, en un solo lugar." };
    case "features-bento": return { eyebrow:"Por qué nosotros", headline:`Por qué elegir ${n}`, sub:"Lo que nos hace distintos." };
    case "feature-split": return { r1_title:`Así trabaja ${n}`, r1_img:pick(fam,i+1), r2_img:pick(fam,i+2) };
    case "cta-banner": return { headline:`¿Listo para empezar con ${n}?`, sub:"Da el primer paso hoy. Te respondemos en menos de 24 horas.", cta:"Contáctanos", cta_href:"#contacto" };
    case "testimonial-quote": return { name:"Cliente satisfecho", role:`Sobre ${n}` };
    case "team-cards": return { eyebrow:"Equipo", headline:`El equipo de ${n}`, sub:"Personas reales detrás de cada proyecto." };
    case "logos-strip": return { label:`Marcas que confían en ${n}` };
    case "footer-cta": return { brand:n, tagline:`${n}. Sitio creado con Multiatlas Studio.`, headline:`${n} te espera`, legal:`${n} — sitio de ejemplo generado con Multiatlas Studio.` };
    case "contact-form": {
      const fm = FORM[arch] || FORM.b2b;
      return {
        eyebrow: fm.eyebrow, headline: `${fm.head} ${n}`, sub: "Te respondemos en menos de 24 horas.",
        b1: fm.b[0], b2: fm.b[1], b3: fm.b[2],
        form_subject: `Contacto — ${n}`, form_action: "#", email_directo: `hola@${brandSlug(n)}.mx`,
        nota: "Formulario de ejemplo — en tu sitio real, los mensajes llegan a tu correo o WhatsApp.",
        opt1: fm.opts[0], opt2: fm.opts[1], opt3: fm.opts[2], opt4: fm.opts[3], opt5: fm.opts[4],
        f3_label: "Teléfono / WhatsApp", f2_placeholder: "tu@correo.com", f3_placeholder: "(55) 1234 5678",
        f5_placeholder: "Cuéntanos qué necesitas…",
      };
    }
    case "menu-list": return { headline:`El menú de ${n}` };
    case "listings-grid": return { headline:`Propiedades de ${n}` };
    case "pricing-trio": return { headline:`Planes de ${n}` };
    case "pricing-duo": return { headline:`Precios de ${n}` };
    case "gallery-grid": return { eyebrow:"Galería", headline:`Trabajo de ${n}`, sub:"Una muestra de lo que hacemos." };
    default: return {};
  }
}

// Copia del nav elegido con enlaces DINÁMICOS (solo a secciones presentes → sin anclas muertas).
function navCopy(slug, brand, links, ctaLabel) {
  const L = (k) => links[k] || { label: "", href: "#contacto" };
  const base = { brand, cta: ctaLabel, cta_href: "#contacto" };
  if (slug === "nav-simple") {
    return Object.assign(base, {
      link1: L(0).label, link1_href: L(0).href, link2: L(1).label, link2_href: L(1).href,
      link3: L(2).label, link3_href: L(2).href,
    });
  }
  // nav-center y nav-sidebar aceptan hasta 4 enlaces (los vacíos se ocultan por CSS: nav a:empty)
  return Object.assign(base, {
    link1: L(0).label, link1_href: L(0).href, link2: L(1).label, link2_href: L(1).href,
    link3: L(2).label, link3_href: L(2).href, link4: L(3).label, link4_href: L(3).href,
  });
}

// ─────────────────────────────────────────────────────── Video cinemático de hero por rubro
// URLs de Pexels CDN (licencia libre comercial, sin token de expiración) + 1 Mixkit; TODAS verificadas
// (HTTP 200, video/mp4, horizontales, 1080p, 3–21 MB). Si una muere, el <video> se autodestruye
// (onerror en el template) y queda la foto ken-burns — nunca rompe la página.
const VIDEO = {
  salud:   ["https://videos.pexels.com/video-files/6630953/6630953-hd_2048_1080_25fps.mp4","https://videos.pexels.com/video-files/6502636/6502636-hd_2048_1080_25fps.mp4"],
  inmob:   ["https://videos.pexels.com/video-files/15613412/15613412-hd_1920_1080_30fps.mp4","https://videos.pexels.com/video-files/3773486/3773486-hd_1920_1080_30fps.mp4","https://videos.pexels.com/video-files/8319683/8319683-hd_1920_1080_25fps.mp4"],
  food:    ["https://videos.pexels.com/video-files/3196175/3196175-hd_1920_1080_25fps.mp4","https://videos.pexels.com/video-files/854216/854216-hd_1920_1080_25fps.mp4"],
  cafe:    ["https://videos.pexels.com/video-files/4052733/4052733-hd_1920_1080_25fps.mp4","https://videos.pexels.com/video-files/2853794/2853794-hd_1920_1080_24fps.mp4"],
  fitness: ["https://videos.pexels.com/video-files/3196220/3196220-hd_1920_1080_25fps.mp4","https://videos.pexels.com/video-files/5319759/5319759-hd_1920_1080_25fps.mp4"],
  belleza: ["https://videos.pexels.com/video-files/6629950/6629950-hd_2048_1080_25fps.mp4","https://assets.mixkit.co/videos/52162/52162-720.mp4"],
  saas:    ["https://videos.pexels.com/video-files/17599631/17599631-hd_1920_1080_30fps.mp4","https://videos.pexels.com/video-files/15439670/15439670-hd_1920_1080_30fps.mp4","https://videos.pexels.com/video-files/11041433/11041433-hd_1920_1080_30fps.mp4"],
  pro:     ["https://videos.pexels.com/video-files/15191845/15191845-hd_1920_1080_60fps.mp4","https://videos.pexels.com/video-files/3246669/3246669-hd_1920_1080_25fps.mp4","https://videos.pexels.com/video-files/6952021/6952021-hd_1920_1080_25fps.mp4"],
  auto:    ["https://videos.pexels.com/video-files/5309351/5309351-hd_1920_1080_25fps.mp4","https://videos.pexels.com/video-files/20151336/20151336-hd_1920_1080_24fps.mp4"],
  hotel:   ["https://videos.pexels.com/video-files/4531362/4531362-hd_1920_1080_30fps.mp4","https://videos.pexels.com/video-files/3858859/3858859-hd_1920_1080_24fps.mp4","https://videos.pexels.com/video-files/19773860/19773860-hd_1920_1080_25fps.mp4"],
  edu:     ["https://videos.pexels.com/video-files/20132264/20132264-hd_1920_1080_60fps.mp4","https://videos.pexels.com/video-files/8499710/8499710-hd_1920_1080_30fps.mp4"],
  tienda:  ["https://videos.pexels.com/video-files/9509328/9509328-hd_2048_1080_25fps.mp4","https://videos.pexels.com/video-files/7669196/7669196-hd_2048_1080_25fps.mp4"],
  abstract:["https://videos.pexels.com/video-files/7670836/7670836-hd_1920_1080_30fps.mp4","https://videos.pexels.com/video-files/7677320/7677320-hd_1920_1080_25fps.mp4","https://videos.pexels.com/video-files/10296179/10296179-hd_1920_1080_25fps.mp4"],
};
// Rubros con matiz propio primero (keywords), luego familia visual, y abstracto premium de fallback.
function videoCatFor(ind) {
  const hay = (ind.key + " " + (ind.keywords || []).join(" ")).toLowerCase();
  if (/gym|fitness|crossfit|yoga|pilates|sport|entrenamiento|athlet/.test(hay)) return "fitness";
  if (/spa|beauty|salon|barber|nail|esthetic|aesthetic|makeup|skincare|hair/.test(hay)) return "belleza";
  if (/coffee|cafe|barista|tea|matcha|bakery|pastel/.test(hay)) return "cafe";
  if (/\bauto|car dealer|cars|mechanic|vehicle|motorcycle|detailing/.test(hay)) return "auto";
  const byFam = { salud:"salud", food:"food", inmob:"inmob", hotel:"hotel", edu:"edu", saas:"saas", tienda:"tienda", pro:"pro", creativo:"abstract" };
  return byFam[ind.fam] || "abstract";
}
// Opacidad según tema: en oscuros el video luce cinemático; en claros queda sutil para no matar contraste.
export function videoFor(ind) {
  const pool = VIDEO[videoCatFor(ind)] || VIDEO.abstract;
  return { video_url: pool[ind.i % pool.length], video_opacity: ind.dark ? "0.50" : "0.26" };
}

// ─────────────────────────────────────────────────────── INDUSTRIES (datos + traducción)
export const INDUSTRIES = DATA.map((d, i) => {
  const es = ESBY[d.key] || {};
  const arch = BLUEPRINTS[es.arch] ? es.arch : "b2b";
  const cat = es.cat_es || "Otros";
  return { key:d.key, label:es.label_es || d.label, cat, arch, i, fam:CAT_FAM[cat] || "pro", keywords:d.keywords || [], tokens:d.tokens, anti:d.anti || "", dark:!!d.dark, style:d.style || "" };
});

// Efecto visual (skin) según el estilo recomendado de la industria (styles.csv).
export function styleFx(style) {
  const s = (style || "").toLowerCase();
  if (/glass/.test(s)) return "fx-glass";
  if (/clay/.test(s)) return "fx-clay";
  if (/neumor|soft ui/.test(s)) return "fx-neu";
  if (/brutal/.test(s)) return "fx-brutal";
  return "";
}

// Fondo animado por industria (vibe motionsites). ~58% recibe uno; el resto queda limpio.
// Oscuras → stars/grid/aurora/mesh; claras → mesh/dots/aurora (mejor contraste).
export function bgFor(ind, r) {
  if (r() < 0.42) return "";
  const dark = ["stars", "grid", "aurora", "mesh"];
  const light = ["mesh", "dots", "aurora"];
  const pool = ind && ind.dark ? dark : light;
  return pool[Math.floor(r() * pool.length)];
}

export function buildIndustryConfig(ind) {
  const r = makeRng(seedFor(ind.key));
  const bps = BLUEPRINTS[ind.arch] || BLUEPRINTS.b2b;
  const content = pickR(r, bps).slice();
  const nav = pickR(r, NAVS);
  const scroll = r() < 0.22 ? "snap" : "";
  const bg = bgFor(ind, r);

  // Garantiza formulario de contacto y footer.
  if (content.indexOf("contact-form") === -1) content.push("contact-form");
  const ordered = [nav, ...content, "footer-cta"];

  // Enlaces del nav a partir de las secciones ancladas presentes.
  const links = [];
  const seen = {};
  content.forEach(slug => { const a = ANCHOR[slug]; if (a && a[0] !== "contacto" && !seen[a[0]]) { seen[a[0]] = 1; links.push({ label: a[1], href: "#" + a[0] }); } });
  // "Contacto" NO va como enlace: el botón CTA del nav ya apunta a #contacto (evita el duplicado).
  const secondaryHref = links[0] ? links[0].href : "#contacto";
  const ctaLabel = ({ food:"Reservar", saas:"Probar gratis", b2b:"Cotizar", realestate:"Agendar", edu:"Inscribirme" })[ind.arch] || "Contacto";

  // Fuentes.
  const f = FONTSBY[ind.key];
  const disp = f ? `'${f.display}', ${f.display_fb || "sans-serif"}` : ((FONTS[ind.arch]||{}).d || "'Space Grotesk', sans-serif");
  const body = f ? `'${f.body}', sans-serif` : "'Inter', sans-serif";
  const tokens = Object.assign({}, ind.tokens, { "--ma-font-display": disp, "--ma-font-body": body });

  // Copia + animación por sección.
  let ci = 0;
  const sections = ordered.map(slug => {
    let copy = copyFor(slug, ind);
    if (/^nav/.test(slug)) copy = navCopy(slug, ind.label, links, ctaLabel);
    if (/^hero-/.test(slug)) copy = Object.assign(copy, videoFor(ind)); // video cinemático del rubro
    if (/^hero-(glow|split|center)$/.test(slug)) copy = Object.assign(copy, { cta2_href: secondaryHref });
    copy = Object.assign(copy, itemsFor(slug, ind, r)); // arrays con nº variable por semilla
    const anim = /^nav/.test(slug) ? "" : animFor(slug, r, ci++);
    return { use: slug, copy, anim };
  });

  return {
    name: ind.key, lang: "es", theme: { tokens }, fx: styleFx(ind.style), scroll, bg,
    meta: { title: `${ind.label} — creado con Multiatlas Studio`, description: `${ind.label}: sitio premium compuesto con Multiatlas Studio.` },
    sections,
  };
}

export const CATEGORIES = [...new Set(INDUSTRIES.map(i => i.cat))];

export function allIndustryConfigs() {
  return INDUSTRIES.map(ind => ({ key:ind.key, label:ind.label, cat:ind.cat, theme:(ind.dark?"oscuro":"claro")+" · curado", keywords:ind.keywords, config:buildIndustryConfig(ind) }));
}
