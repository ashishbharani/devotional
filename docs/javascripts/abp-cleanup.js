/* Retire the former offline/PWA layer without touching unrelated browser data. */
(() => {
  "use strict";

  const VERSION = "online-v1";
  const MARKER = "abp-offline-cleanup";
  const script = document.querySelector('script[src*="javascripts/abp-cleanup.js"]');
  const root = script ? new URL("../", script.src).href : new URL("./", location.href).href;

  async function cleanup() {
    try {
      if (localStorage.getItem(MARKER) === VERSION) return;
    } catch (error) { /* storage may be unavailable */ }

    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations
          .filter((registration) => registration.scope === root)
          .map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("abp-")).map((key) => caches.delete(key)));
      }
      try {
        localStorage.setItem(MARKER, VERSION);
        localStorage.removeItem("abp-install-dismissed");
      } catch (error) { /* storage may be unavailable */ }
    } catch (error) {
      console.warn("Could not finish the retired offline-cache cleanup", error);
    }
  }

  if (document.readyState === "loading") window.addEventListener("load", cleanup, { once: true });
  else cleanup();
})();
