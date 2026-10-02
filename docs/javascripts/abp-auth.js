/* Accessible optional account control for Firebase Google sign-in. */
(() => {
  "use strict";

  const t = (key) => window.abpI18n ? window.abpI18n.t(key) : key;
  let authState = { user: null, configured: false, ready: false };

  function announce(key) {
    let status = document.querySelector("#abp-account-status");
    if (!status) {
      status = document.createElement("p");
      status.id = "abp-account-status";
      status.className = "abp-sr";
      status.setAttribute("role", "status");
      status.setAttribute("aria-live", "polite");
      document.body.appendChild(status);
    }
    status.textContent = t(key);
  }

  function closeMenu() {
    const menu = document.querySelector(".abp-account-menu");
    const button = document.querySelector(".abp-account-btn");
    if (menu) menu.hidden = true;
    if (button) button.setAttribute("aria-expanded", "false");
  }

  async function accountClick(event) {
    const button = event.currentTarget;
    if (authState.user) {
      const menu = document.querySelector(".abp-account-menu");
      const opening = menu.hidden;
      closeMenu();
      menu.hidden = !opening;
      button.setAttribute("aria-expanded", String(opening));
      if (opening) menu.querySelector("a,button")?.focus();
      return;
    }
    button.disabled = true;
    try {
      await window.abpFirebase.signIn();
    } catch (error) {
      const key = window.abpFirebase.friendlyError(error);
      if (key !== "signInCancelled") announce(key);
    } finally {
      button.disabled = false;
    }
  }

  async function doSignOut() {
    closeMenu();
    try {
      await window.abpFirebase.signOut();
      announce("signedOut");
    } catch (error) {
      announce("signOutFailed");
    }
  }

  function render() {
    const button = document.querySelector(".abp-account-btn");
    const menu = document.querySelector(".abp-account-menu");
    if (!button || !menu) return;
    const user = authState.user;
    const summary = document.querySelector("#abp-account-summary");
    if (summary) summary.textContent = user
      ? `${t("account")}: ${user.displayName || user.email || "Google"}`
      : t("signInGoogle");
    button.disabled = !authState.ready;
    if (!user) {
      button.classList.remove("is-signed-in");
      button.setAttribute("aria-label", t("signInGoogle"));
      button.innerHTML = '<span class="abp-google" aria-hidden="true">G</span><span data-i18n="signIn">Sign in</span>';
      menu.hidden = true;
      return;
    }
    const name = user.displayName || t("account");
    button.classList.add("is-signed-in");
    button.setAttribute("aria-label", `${t("account")}: ${name}`);
    button.innerHTML = user.photoURL
      ? `<img src="${String(user.photoURL).replace(/[&<>'"]/g, "")}" alt=""><span>${name.replace(/[&<>]/g, "")}</span>`
      : `<span class="abp-google" aria-hidden="true">G</span><span>${name.replace(/[&<>]/g, "")}</span>`;
  }

  function init() {
    const header = document.querySelector(".md-header__inner");
    if (!header || header.querySelector(".abp-account")) return;
    const root = document.createElement("div");
    root.className = "abp-account";
    root.innerHTML =
      '<button type="button" class="abp-account-btn md-header__button" aria-haspopup="menu" aria-expanded="false"></button>' +
      '<div class="abp-account-menu" role="menu" hidden>' +
      '<a role="menuitem" href="' + new URL("favourites/", window.abpSiteRoot).href + '" data-i18n="myFavourites">My Favourites</a>' +
      '<a role="menuitem" href="' + new URL("favourites/#account", window.abpSiteRoot).href + '" data-i18n="account">Account</a>' +
      '<button type="button" role="menuitem" data-sign-out data-i18n="signOut">Sign out</button></div>';
    root.querySelector(".abp-account-btn").addEventListener("click", accountClick);
    root.querySelector("[data-sign-out]").addEventListener("click", doSignOut);
    root.querySelector(".abp-account-menu").addEventListener("keydown", (event) => {
      const items = [...event.currentTarget.querySelectorAll('[role="menuitem"]')];
      const index = items.indexOf(document.activeElement);
      if (event.key === "Escape") { closeMenu(); root.querySelector(".abp-account-btn").focus(); return; }
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 :
        (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      items[next].focus();
    });
    const language = header.querySelector(".abp-language-btn");
    header.insertBefore(root, language || header.querySelector(".md-search") || null);
    render();
  }

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".abp-account")) closeMenu();
  });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeMenu(); });
  document.addEventListener("abp-languagechange", render);
  window.abpFirebase.observe((next) => {
    authState = next;
    init();
    render();
    if (next.error) announce(window.abpFirebase.friendlyError(next.error));
  });
  if (window.document$?.subscribe) window.document$.subscribe(init);
  else document.addEventListener("DOMContentLoaded", init);
})();
