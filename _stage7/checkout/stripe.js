/* ============================================================================
 * Multiatlas Studio — Stripe (CASCARÓN)
 * ----------------------------------------------------------------------------
 * CONFIGURA SOLO ESTE ARCHIVO para activar el cobro. Guía paso a paso: STRIPE.md
 *
 * 3 modos:
 *   "off"     → sin cobro. Los botones dejan entrar al Studio en modo demo
 *               (comportamiento actual). Úsalo mientras no tengas datos de Stripe.
 *   "links"   → Payment Links de Stripe. SIN backend. RECOMENDADO para empezar:
 *               creas 2 links en el dashboard y pegas las URLs abajo. Listo.
 *   "session" → Checkout Session vía /api/checkout (requiere desplegar las
 *               funciones de la carpeta /api y las variables de entorno de .env).
 * ==========================================================================*/
(function (w) {
  var CFG = {
    // ───────────────────────────────────────── MODO
    mode: "off",                 // "off" | "links" | "session"

    // ───────────────────────────── PAYMENT LINKS  (mode: "links")
    // Crea los links en https://dashboard.stripe.com/payment-links y pégalos:
    links: {
      pro:      "",              // ej. https://buy.stripe.com/aaaaaaaaaaaa
      founding: ""               // ej. https://buy.stripe.com/bbbbbbbbbbbb
    },

    // ─────────────────────────── CHECKOUT SESSION  (mode: "session")
    publishableKey: "",          // pk_live_… o pk_test_…  (la secret key va en .env, NUNCA aquí)
    endpoint: "/api/checkout",   // función serverless de /api

    // ───────────────────────────────────────── REDIRECCIONES
    successUrl: "/checkout/success/",
    cancelUrl:  "/checkout/cancel/",

    // ─────────── FALLBACK cuando mode:"off" o falta un dato (no rompe la demo)
    fallbackUrl: "/#contacto"
  };

  // Devuelve true si tomó el control (redirige a Stripe) — el llamador NO debe seguir.
  // Devuelve false si no hay cobro configurado — el llamador entra a la demo como siempre.
  CFG.checkout = function (plan) {
    plan = (String(plan).toLowerCase() === "founding") ? "founding" : "pro";

    if (CFG.mode === "links" && CFG.links[plan]) {
      w.location.href = CFG.links[plan];
      return true;
    }

    if (CFG.mode === "session" && CFG.publishableKey) {
      var origin = w.location.origin;
      // Adjunta el token de Clerk (si hay login) para que el servidor ate el pago al usuario.
      (async function () {
        var headers = { "Content-Type": "application/json" };
        try { if (w.MA_AUTH && w.MA_AUTH.isEnabled()) { var t = await w.MA_AUTH.token(); if (t) headers.Authorization = "Bearer " + t; } } catch (_) {}
        try {
          var r = await fetch(CFG.endpoint, { method: "POST", headers: headers, body: JSON.stringify({ plan: plan, success_url: origin + CFG.successUrl, cancel_url: origin + CFG.cancelUrl }) });
          var d = await r.json();
          if (d && d.url) { w.location.href = d.url; }
          else { console.error("[stripe] respuesta sin url:", d); w.location.href = CFG.fallbackUrl; }
        } catch (e) { console.error("[stripe] checkout falló:", e); w.location.href = CFG.fallbackUrl; }
      })();
      return true;
    }

    console.warn("[stripe] Cobro sin configurar (mode: \"" + CFG.mode + "\"). " +
                 "Edita checkout/stripe.js — ver STRIPE.md. Entrando en modo demo.");
    return false;
  };

  CFG.isLive = function () {
    return (CFG.mode === "links"   && !!CFG.links.pro && !!CFG.links.founding) ||
           (CFG.mode === "session" && !!CFG.publishableKey);
  };

  w.MA_STRIPE = CFG;
})(window);
