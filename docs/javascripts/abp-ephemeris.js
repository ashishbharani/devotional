// SPDX-License-Identifier: AGPL-3.0-or-later
(function () {
  "use strict";
  const moduleUrl = new URL("../assets/ephemeris/ephemeris-app.mjs", document.currentScript.src);
  const styleUrl = new URL("../stylesheets/ephemeris.css", document.currentScript.src);
  async function initialize() {
    const roots = document.querySelectorAll("[data-ephemeris]:not([data-ephemeris-ready])");
    if (!roots.length) return;
    if (!document.getElementById("abp-ephemeris-style")) {
      const link = document.createElement("link");
      link.id = "abp-ephemeris-style"; link.rel = "stylesheet"; link.href = styleUrl.href;
      document.head.append(link);
    }
    roots.forEach((root) => { root.dataset.ephemerisReady = "loading"; });
    try {
      const app = await import(moduleUrl.href);
      roots.forEach((root) => app.initializeEphemeris(root));
    } catch (error) {
      console.error("Ephemeris initialization failed", error);
      roots.forEach((root) => {
        root.dataset.ephemerisReady = "error";
        root.textContent = "Ephemeris engine unavailable. Please reload or try again.";
      });
    }
  }
  if (window.document$?.subscribe) window.document$.subscribe(initialize);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
