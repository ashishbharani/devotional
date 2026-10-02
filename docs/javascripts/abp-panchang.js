(function () {
  "use strict";

  const script = document.currentScript;
  const moduleUrl = new URL("../assets/panchang/panchang-app.mjs", script.src).href;
  const siteRoot = new URL("../", script.src).href;

  async function initialize() {
    const roots = document.querySelectorAll("[data-panchang-view]:not([data-panchang-ready])");
    if (!roots.length) return;
    roots.forEach((root) => { root.dataset.panchangReady = "loading"; });
    try {
      const app = await import(moduleUrl);
      roots.forEach((root) => app.initializePanchang(root, { siteRoot }));
    } catch (error) {
      console.error("Panchang failed to initialize", error);
      roots.forEach((root) => {
        root.dataset.panchangReady = "error";
        const status = root.querySelector("[data-panchang-status]");
        if (status) {
          status.textContent = "Today’s Panchang could not be calculated.";
          const retry = document.createElement("button");
          retry.type = "button";
          retry.className = "abp-btn";
          retry.textContent = "Retry";
          retry.addEventListener("click", () => location.reload(), { once: true });
          status.append(" ", retry);
        }
      });
    }
  }

  if (window.document$?.subscribe) window.document$.subscribe(initialize);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
