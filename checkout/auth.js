/* ============================================================================
 * Multiatlas Studio — Auth con Clerk (CASCARÓN)
 * CONFIGURA SOLO la publishableKey de abajo. La SECRET key va en las variables de
 * entorno de Vercel (CLERK_SECRET_KEY), NUNCA aquí.
 *
 * Si publishableKey está vacía → auth DESACTIVADA: el sitio funciona como demo
 * (igual que hoy, cualquiera entra y descarga). En cuanto pegas tu llave y despliegas,
 * se activa el login y el muro de suscripción.
 * ==========================================================================*/
(function (w) {
  var AUTH = {
    publishableKey: "pk_test_ZW5qb3llZC1hc3AtNDYuY2xlcmsuYWNjb3VudHMuZGV2JA", // Clerk → API Keys → Publishable key

    _clerk: null,
    _loaded: false,

    isEnabled: function () { return !!this.publishableKey; },

    // Carga el SDK de Clerk (una vez). Devuelve true si quedó listo.
    load: async function () {
      if (!this.publishableKey) return false;
      if (this._loaded) return true;
      if (!w.Clerk) {
        await new Promise(function (resolve, reject) {
          var s = document.createElement("script");
          s.async = true; s.crossOrigin = "anonymous";
          s.setAttribute("data-clerk-publishable-key", AUTH.publishableKey);
          s.src = "https://cdn.jsdelivr.net/npm/@clerk/clerk-js@5/dist/clerk.browser.js";
          s.onload = resolve; s.onerror = reject;
          document.head.appendChild(s);
        });
      }
      this._clerk = w.Clerk;
      await this._clerk.load();
      this._loaded = true;
      return true;
    },

    isSignedIn: function () { return !!(this._clerk && this._clerk.user); },
    userId: function () { return this._clerk && this._clerk.user ? this._clerk.user.id : null; },
    openSignIn: function () { if (this._clerk) this._clerk.openSignIn(); },
    openSignUp: function () { if (this._clerk) this._clerk.openSignUp(); },
    signOut: function () { if (this._clerk) this._clerk.signOut(); },
    mountUserButton: function (el) { if (this._clerk && el) this._clerk.mountUserButton(el); },
    onChange: function (cb) { if (this._clerk) this._clerk.addListener(cb); },
    token: async function () { return (this._clerk && this._clerk.session) ? await this._clerk.session.getToken() : null; },

    // Pregunta al servidor el estado real de suscripción del usuario logueado.
    // Devuelve { signedIn, active, plan }. En modo demo (sin key) → active:true para no romper la demo.
    status: async function () {
      if (!this.isEnabled()) return { signedIn: true, active: true, plan: "demo" };
      var t = await this.token();
      var r = await fetch("/api/me", { headers: t ? { Authorization: "Bearer " + t } : {} });
      return await r.json();
    },
  };
  w.MA_AUTH = AUTH;
})(window);
