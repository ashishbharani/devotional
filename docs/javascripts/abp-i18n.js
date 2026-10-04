/* Central interface translation catalogue plus safe sacred-title transliteration. */
(() => {
  "use strict";

  const STORAGE_KEY = "abp-language";
  const order = ["en", "hi", "mr", "gu", "bn", "pa", "te", "kn", "ml", "ta"];
  const localeNames = {
    en: "English", hi: "हिन्दी", mr: "मराठी", gu: "ગુજરાતી", bn: "বাংলা",
    pa: "ਪੰਜਾਬੀ", te: "తెలుగు", kn: "ಕನ್ನಡ", ml: "മലയാളം", ta: "தமிழ்",
  };
  const FALLBACK = {
    language: "Language", close: "Close", original: "Original", loading: "Loading…",
    showMore: "Show more", chooseLetter: "Choose a starting letter", other: "Other",
    shown: "shown", noWorks: "No works begin with this selection", errorIndex: "Could not load the works index.",
    category: "Category", currentCount: "Current count", tapToCount: "Tap to count +1",
    lastTapUndone: "Last tap undone", freshQuestion: "Start a fresh session? Today’s total will be kept.",
    resetQuestion: "Reset the current session and today’s total? This cannot be undone.",
    myFavourites: "My Favourites", account: "Account", signIn: "Sign in", signInGoogle: "Sign in with Google",
    signOut: "Sign out", addFavourite: "Add to favourites", removeFavourite: "Remove from favourites",
    favourites: "favourites", installApp: "Install App", listen: "Listen",
    firebaseNotConfigured: "Google sign-in is not configured yet.", popupBlocked: "The sign-in popup was blocked.",
    networkError: "A network error occurred.", sessionExpired: "Your session expired. Please sign in again.",
    signInFailed: "Sign-in could not be completed.", signOutFailed: "Sign-out could not be completed.", signedOut: "You have signed out.",
    titleTransliterationNote: "Sacred work names use script transliteration. The original title remains available underneath.",
  };
  const script = document.querySelector('script[src*="javascripts/abp-i18n.js"]');
  const rootUrl = script ? new URL("../", script.src) : new URL("./", location.href);
  const catalogueUrl = new URL("assets/i18n.json", rootUrl);
  const store = {
    get: () => { try { return localStorage.getItem(STORAGE_KEY); } catch (error) { return null; } },
    set: (value) => { try { localStorage.setItem(STORAGE_KEY, value); } catch (error) { /* private browsing */ } },
  };
  const chromeLabels = new Map([
    ["Home", "home"], ["Foreword", "foreword"], ["Disclaimer & Terms", "disclaimer"],
    ["Hindu Scriptures & Books Library", "library"], ["Scriptures & Books Library", "library"],
    ["Devotional Works", "index"], ["Integrated Master Index", "index"], ["Find a Work", "find"],
    ["A–Z Work Directory", "directory"], ["Japa / Devotional Counter", "japa"], ["My Favourites", "myFavourites"], ["Tools", "tools"],
  ]);
  const originalText = new WeakMap();
  let locales = Object.fromEntries(order.map((code) => [code, { name: localeNames[code], strings: {} }]));
  let categoryNames = {};
  let current = store.get() || "en";
  if (!order.includes(current)) current = "en";

  const t = (key) => locales[current]?.strings[key] || locales.en?.strings[key] || FALLBACK[key] || key;

  const ready = fetch(catalogueUrl.href)
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then((data) => {
      const sections = data.sections || [];
      const keys = sections.flatMap((section) => section.keys || []);
      locales = Object.fromEntries(order.map((code) => {
        const values = sections.flatMap((section) => section.values?.[code] || []);
        const strings = Object.fromEntries(keys.map((key, index) => [key, values[index]]));
        return [code, { name: data.localeNames?.[code] || localeNames[code], strings }];
      }));
      categoryNames = data.categoryNames || {};
    })
    .catch((error) => console.warn("Interface translation catalogue could not be loaded", error));

  function transliterateText(node, explicit) {
    const engine = window.abpTransliterate;
    const original = originalText.get(node) || explicit || node.textContent.trim();
    originalText.set(node, original);
    if (!engine || current === "en" || !engine.languages.has(current)) {
      node.textContent = original;
      node.removeAttribute("lang");
      node.removeAttribute("title");
      return;
    }
    node.textContent = engine.transliterate(original, current);
    node.lang = current;
    node.title = `${t("original")}: ${original}`;
  }

  function translateWorkTitles(root = document) {
    const engine = window.abpTransliterate;
    root.querySelectorAll(".abp-work-title").forEach((node) => {
      const original = originalText.get(node) || node.textContent.trim();
      originalText.set(node, original);
      const anchor = node.closest("a");
      let source = anchor && anchor.querySelector(".abp-work-original");
      if (!engine || current === "en" || !engine.languages.has(current)) {
        node.textContent = original;
        node.removeAttribute("lang");
        if (source) source.remove();
        return;
      }
      const converted = engine.transliterate(original, current);
      node.textContent = converted;
      node.lang = current;
      if (!anchor || converted === original) {
        if (source) source.remove();
        return;
      }
      if (!source) {
        source = document.createElement("small");
        source.className = "abp-work-original";
        source.lang = "en";
        anchor.appendChild(source);
      }
      source.textContent = `${t("original")}: ${original}`;
    });
  }

  function translate(root = document) {
    root.querySelectorAll(".md-nav__link").forEach((node) => {
      const key = chromeLabels.get(node.textContent.trim());
      if (key) node.setAttribute("data-i18n", key);
    });
    root.querySelectorAll("[data-i18n]").forEach((node) => {
      const value = t(node.getAttribute("data-i18n"));
      if (value) node.textContent = value;
    });
    root.querySelectorAll("[data-i18n-aria]").forEach((node) => node.setAttribute("aria-label", t(node.getAttribute("data-i18n-aria"))));
    root.querySelectorAll("[data-i18n-title]").forEach((node) => node.setAttribute("title", t(node.getAttribute("data-i18n-title"))));
    root.querySelectorAll("[data-i18n-placeholder]").forEach((node) => node.setAttribute("placeholder", t(node.getAttribute("data-i18n-placeholder"))));
    root.querySelectorAll("[data-i18n-label]").forEach((node) => node.setAttribute("data-label", t(node.getAttribute("data-i18n-label"))));
    root.querySelectorAll("[data-i18n-value]").forEach((node) => { node.textContent = t(node.getAttribute("data-i18n-value")); });
    root.querySelectorAll("[data-i18n-all]").forEach((node) => { node.textContent = `${t("all")} ${t(node.getAttribute("data-i18n-all"))}`; });
    root.querySelectorAll("[data-category-name]").forEach((node) => {
      const number = Number(node.getAttribute("data-category-name"));
      const translated = categoryNames[current]?.[number - 1];
      if (translated) {
        const original = originalText.get(node) || node.textContent.trim();
        originalText.set(node, original);
        node.textContent = translated;
        node.lang = current;
        node.title = current === "en" ? "" : `${t("original")}: ${original}`;
      } else transliterateText(node);
    });
    root.querySelectorAll("[data-transliterate-ui]").forEach((node) => transliterateText(node));
    translateWorkTitles(root);
  }

  function applyLanguage(code) {
    current = order.includes(code) ? code : "en";
    store.set(current);
    document.documentElement.lang = current;
    document.documentElement.dir = "ltr";
    translate();
    document.querySelectorAll(".abp-language-btn").forEach((button) => {
      button.querySelector("span").textContent = locales[current].name;
      button.setAttribute("aria-label", `${t("language")}: ${locales[current].name}`);
      button.title = `${t("language")}: ${locales[current].name}`;
    });
    document.dispatchEvent(new CustomEvent("abp-languagechange", { detail: { language: current } }));
  }

  function openPicker() {
    const dialog = document.createElement("dialog");
    dialog.className = "abp-language-dialog";
    dialog.setAttribute("aria-labelledby", "abp-language-title");
    dialog.innerHTML =
      `<div class="abp-language-dialog__head"><h2 id="abp-language-title">${t("language")}</h2>` +
      `<button type="button" class="abp-language-dialog__close" aria-label="${t("close")}">×</button></div>` +
      `<p class="abp-language-dialog__note">${t("titleTransliterationNote")}</p>` +
      '<div class="abp-language-grid">' + order.map((code) => {
        const locale = locales[code];
        return `<button type="button" lang="${code}" dir="ltr" data-lang="${code}"${code === current ? ' aria-current="true"' : ""}>` +
          `<span>${locale.name}</span>${code === "en" ? `<small>${t("original")}</small>` : ""}</button>`;
      }).join("") + "</div>";
    document.body.appendChild(dialog);
    const close = () => { dialog.close(); dialog.remove(); };
    dialog.querySelector(".abp-language-dialog__close").addEventListener("click", close);
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    dialog.querySelectorAll("[data-lang]").forEach((button) => button.addEventListener("click", () => {
      applyLanguage(button.getAttribute("data-lang"));
      close();
    }));
    dialog.showModal ? dialog.showModal() : dialog.setAttribute("open", "");
  }

  function addPicker() {
    const header = document.querySelector(".md-header__inner");
    if (!header || header.querySelector(".abp-language-btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "abp-language-btn md-header__button";
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.9 15.1 10.4 8.6H8.6l-3.5 9h1.8l.8-2.2h3.6l.8 2.2h1.8l-1-2.5ZM8.3 13.8l1.2-3.3 1.2 3.3H8.3ZM20 4h-6V2h-2v2H6v2h9.9c-.5 1.5-1.4 3-2.5 4.2-.8-.9-1.5-2-2-3.2h-2c.6 1.7 1.5 3.2 2.7 4.5l-2 1.9.7 1.8 2.6-2.4c1.4 1.2 3 2.2 4.8 2.8l.6-1.8c-1.5-.5-2.9-1.3-4.1-2.3C17.2 9.9 18.3 8 18.8 6H20V4Z"/></svg><span></span>';
    button.addEventListener("click", openPicker);
    const search = header.querySelector(".md-search") || header.lastElementChild;
    header.insertBefore(button, search);
  }

  async function initPage() {
    addPicker();
    await ready;
    applyLanguage(current);
  }

  window.abpI18n = { t, translate, applyLanguage, ready, get language() { return current; }, get locales() { return locales; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initPage);
  else initPage();
  if (window.document$ && typeof window.document$.subscribe === "function") window.document$.subscribe(initPage);
})();
