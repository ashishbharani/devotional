/* Install UI and scoped service-worker registration for /devotional/. */
(() => {
  "use strict";
  const root = window.abpSiteRoot;
  const t = (key) => window.abpI18n ? window.abpI18n.t(key) : key;
  const standalone = () => window.matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const isiOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let installEvent = null;

  function button() { return document.querySelector(".abp-install-btn"); }
  function removeButton() { button()?.remove(); }
  function showIOSHelp() {
    if (document.querySelector(".abp-ios-install")) return;
    const note = document.createElement("aside");
    note.className = "abp-ios-install";
    note.setAttribute("role", "status");
    note.innerHTML = `<span>${t("iosInstallHelp")}</span><button type="button" aria-label="${t("close")}">×</button>`;
    note.querySelector("button").addEventListener("click", () => note.remove());
    document.body.appendChild(note);
  }
  async function install() {
    if (isiOS && !installEvent) { showIOSHelp(); return; }
    if (!installEvent) return;
    const prompt = installEvent;
    installEvent = null;
    removeButton();
    await prompt.prompt();
    await prompt.userChoice;
  }
  function addButton() {
    if (standalone() || (!installEvent && !isiOS)) return;
    const header = document.querySelector(".md-header__inner");
    if (!header || button()) return;
    const control = document.createElement("button");
    control.type = "button";
    control.className = "abp-install-btn md-header__button";
    control.innerHTML = '<span aria-hidden="true">⇩</span><span data-i18n="installApp">Install App</span>';
    control.setAttribute("aria-label", t("installApp"));
    control.addEventListener("click", install);
    header.insertBefore(control, header.querySelector(".abp-account") || header.querySelector(".md-search"));
  }
  window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); installEvent = event; addButton(); });
  window.addEventListener("appinstalled", () => { installEvent = null; removeButton(); });
  document.addEventListener("abp-languagechange", () => {
    const control = button();
    if (control) { control.querySelector("span:last-child").textContent = t("installApp"); control.setAttribute("aria-label", t("installApp")); }
  });
  if ("serviceWorker" in navigator) window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("sw.js", root), { scope: root.pathname }).catch((error) => console.warn("UDHC offline support could not start", error));
  }, { once: true });
  if (isiOS) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", addButton);
    else addButton();
  }
  if (window.document$?.subscribe) window.document$.subscribe(addButton);
})();
