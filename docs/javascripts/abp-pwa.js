/* One install state machine for the existing header/menu controls and scoped SW. */
(() => {
  "use strict";
  const root = window.abpSiteRoot;
  const t = key => window.abpI18n ? window.abpI18n.t(key) : key;
  const mode = window.matchMedia("(display-mode: standalone)");
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  let installEvent = null, busy = false, installed = false, awaitingInstall = false, message = "";
  const standalone = () => installed || mode.matches || navigator.standalone === true;
  const controls = () => [...document.querySelectorAll("[data-install-app]")];
  function render() {
    const state = standalone() ? "installed" : busy ? "prompting" : awaitingInstall ? "requested" : installEvent ? "ready" : isIOS ? "ios" : "unavailable";
    const disabled = !["ready","ios"].includes(state);
    controls().forEach(control => {
      control.hidden = state === "installed";
      control.disabled = disabled;
      control.dataset.installState = state;
      control.setAttribute("aria-disabled", String(disabled));
      control.setAttribute("aria-label", "Install HDC App");
      control.title = "Install Hindu Devotional Collection";
      control.querySelector(".hdc-install-label").textContent = t("installApp");
    });
    const hint = message || (state === "ios" ? "In Safari, use Share, then Add to Home Screen. Select Install App for instructions." :
      state === "ready" ? "Install HDC using this browser's installation prompt." :
      state === "installed" ? "HDC is installed." :
      "Installation is not available here yet. Use your browser's Install or Add to Home Screen menu where supported.");
    document.querySelectorAll("[data-install-guidance]").forEach(node => node.textContent = hint);
    const announce = document.getElementById("hdc-install-announcement");
    if (announce) announce.textContent = hint;
    const menu = document.querySelector(".hdc-mobile-install");
    if (menu) menu.hidden = state === "installed";
  }
  function showIOSHelp(opener) {
    if (document.querySelector(".hdc-install-help")) return;
    const dialog = document.createElement("dialog");
    dialog.className = "hdc-install-help";
    dialog.setAttribute("aria-labelledby", "hdc-install-help-title");
    const title = document.createElement("h2");
    title.id = "hdc-install-help-title"; title.textContent = "Install HDC App";
    const text = document.createElement("p");
    text.textContent = "Open this website in Safari. Tap Share (the square with an upward arrow), choose Add to Home Screen, then Add. If you cannot find that option, check your browser's Share menu. This website cannot display a native installation prompt on iPhone or iPad.";
    const close = document.createElement("button");
    close.type = "button"; close.textContent = t("done");
    close.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => { dialog.remove(); opener?.focus(); });
    dialog.append(title, text, close);
    document.body.appendChild(dialog);
    dialog.showModal();
  }
  async function install(control) {
    if (standalone() || busy || control.disabled) return;
    if (isIOS && !installEvent) { showIOSHelp(control); return; }
    if (!installEvent) return;
    const prompt = installEvent;
    installEvent = null; busy = true; message = "Waiting for your browser's installation choice."; render();
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      awaitingInstall = choice.outcome === "accepted";
      message = awaitingInstall ? "Installation requested. Complete your browser's steps." :
        "Installation dismissed. You can try again if your browser offers installation.";
    } catch {
      message = "The installation prompt could not be opened. Try your browser's Install or Add to Home Screen menu.";
    } finally { busy = false; render(); }
  }
  document.addEventListener("click", event => {
    const control = event.target.closest("[data-install-app]");
    if (control) install(control);
  });
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault(); installEvent = event; awaitingInstall = false; message = ""; render();
  });
  window.addEventListener("appinstalled", () => {
    installed = true; installEvent = null; awaitingInstall = false; message = ""; render();
  });
  mode.addEventListener("change", render);
  document.addEventListener("abp-languagechange", render);
  if ("serviceWorker" in navigator) window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("sw.js", root), { scope: root.pathname }).catch(error => console.warn("HDC — Hindu Devotional Collection offline support could not start", error));
  }, { once: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", render);
  else render();
  if (window.document$?.subscribe) window.document$.subscribe(render);
})();
