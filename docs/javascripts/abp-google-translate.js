/* Owner-supplied Google Website Translator, loaded only after explicit consent. */
(() => {
  "use strict";
  const CONSENT_KEY = "abp-google-translate-consent-v1";
  const script = document.currentScript;
  const basePath = new URL("../", script.src).pathname;
  let consent = false, loading, initialized = false, generation = 0;
  try { consent = localStorage.getItem(CONSENT_KEY) === "yes"; } catch { /* private browsing */ }

  function host() {
    let element = document.getElementById("google_translate_element");
    if (!element) {
      element = document.createElement("div");
      element.id = "google_translate_element";
      element.className = "notranslate";
      element.translate = false;
      element.addEventListener("change", event => {
        const code = event.target.value || "en";
        if (event.target.tagName === "SELECT" && ["en","hi","mr","gu","bn","pa","te","kn","ml","ta"].includes(code)) {
          document.documentElement.lang = code;
        }
      });
      park(element);
    }
    return element;
  }

  function park(element = document.getElementById("google_translate_element")) {
    if (!element) return;
    let parking = document.getElementById("abp-google-translate-parking");
    if (!parking) {
      parking = document.createElement("div");
      parking.id = "abp-google-translate-parking";
      parking.hidden = true;
      document.body.appendChild(parking);
    }
    parking.appendChild(element);
  }

  function protectPrivateControls() {
    // Do not ask the provider to translate entered values or personal lists.
    document.querySelectorAll("input,textarea,select,.abp-account,#abp-account-summary,#abp-favourites-list").forEach(element => {
      element.classList.add("notranslate");
      element.translate = false;
    });
  }

  function resume() {
    if (!consent) return Promise.resolve();
    protectPrivateControls();
    if (initialized) return Promise.resolve();
    if (loading) return loading;
    const target = host(), run = ++generation;
    loading = new Promise((resolve, reject) => {
      let timer;
      const fail = () => {
        if (run !== generation) return;
        clearTimeout(timer);
        ++generation;
        document.getElementById("abp-google-translate-script")?.remove();
        target.replaceChildren();
        reject(new Error("Google Website Translator unavailable"));
      };
      window.googleTranslateElementInit = () => {
        if (run !== generation || initialized) return;
        try {
          new window.google.translate.TranslateElement({
            pageLanguage: "en", includedLanguages: "hi,mr,gu,bn,pa,te,kn,ml,ta", autoDisplay: false,
          }, "google_translate_element");
          initialized = true;
          clearTimeout(timer);
          resolve();
        } catch { fail(); }
      };
      timer = setTimeout(fail, 30000);
      const loader = document.createElement("script");
      loader.id = "abp-google-translate-script";
      loader.async = true;
      loader.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      loader.referrerPolicy = "no-referrer";
      loader.onerror = fail;
      document.head.appendChild(loader);
    }).catch(error => { loading = null; throw error; });
    return loading;
  }

  function enable() {
    consent = true;
    try { localStorage.setItem(CONSENT_KEY, "yes"); } catch { /* session-only consent */ }
    return resume();
  }

  function disable() {
    consent = false;
    try { localStorage.removeItem(CONSENT_KEY); } catch { /* private browsing */ }
    // Only the provider's translation cookie; never other cookies/preferences.
    for (const path of new Set(["/", basePath])) {
      for (const domain of ["", `; domain=${location.hostname}`, `; domain=.${location.hostname}`]) {
        try { document.cookie = `googtrans=; Max-Age=0; path=${path}${domain}; SameSite=Lax`; } catch { /* blocked cookies */ }
      }
    }
  }

  window.abpGoogleTranslate = {host, park, enable, resume, disable, get enabled() { return consent; }};
})();
