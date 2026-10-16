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
    localTranslationScope: "Local interface and title script (offline): supported labels only, not every paragraph or tool message.",
    wholePageTranslation: "Translate whole page (online, optional)",
    onlineTranslationNotice: "Translate this page here without leaving the site. Enabling Google Translate allows Google to access page text, including displayed location details. Your consent is remembered in this browser. Machine translations may be inaccurate; check sacred and astronomical terms against the original. Internet access is required.",
    openGoogleTranslation: "Enable Google Translate here", translationHelp: "Translation help",
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
    if (document.querySelector(".abp-language-dialog")) return;
    const dialog = document.createElement("dialog");
    dialog.className = "abp-language-dialog";
    dialog.classList.add("notranslate");
    dialog.translate = false;
    dialog.setAttribute("aria-labelledby", "abp-language-title");
    dialog.innerHTML =
      `<div class="abp-language-dialog__head"><h2 id="abp-language-title">${t("language")}</h2>` +
      `<button type="button" class="abp-language-dialog__close" aria-label="${t("close")}">×</button></div>` +
      `<details data-local-language><summary>${t("localTranslationScope")}</summary>` +
      `<p class="abp-language-dialog__note">${t("titleTransliterationNote")}</p>` +
      '<div class="abp-language-grid">' + order.map((code) => {
        const locale = locales[code];
        return `<button type="button" lang="${code}" dir="ltr" data-lang="${code}"${code === current ? ' aria-current="true"' : ""}>` +
          `<span>${locale.name}</span>${code === "en" ? `<small>${t("original")}</small>` : ""}</button>`;
      }).join("") + "</div></details>";
    // Keep the owner's real provider widget on this origin, never a proxy page.
    // Its DOM must survive closing/reopening the picker and instant navigation.
    const provider = window.abpGoogleTranslate;
    const online = document.createElement("section");
    online.setAttribute("aria-labelledby", "abp-online-translation-title");
    const heading = document.createElement("h3");
    heading.id = "abp-online-translation-title";
    heading.textContent = t("wholePageTranslation");
    const note = document.createElement("p");
    note.id = "abp-online-translation-note";
    note.className = "abp-language-dialog__note";
    note.textContent = t("onlineTranslationNotice");
    const controls = document.createElement("p");
    const enable = document.createElement("button");
    enable.type = "button";
    enable.className = "abp-btn";
    enable.dataset.enableTranslation = "";
    enable.textContent = t("openGoogleTranslation");
    const status = document.createElement("p");
    status.setAttribute("role", "status");
    status.dataset.translationStatus = "";
    const start = async () => {
      enable.disabled = true;
      status.textContent = t("loading");
      try {
        if (!provider) throw new Error("Translator not loaded");
        // Start from original text, not a mixture of old local translations
        // and transliteration. Preserve the saved offline language preference.
        if (!provider.enabled) {
          const saved = current;
          current = "en";
          translate();
          current = saved;
          document.documentElement.lang = "en";
        }
        await provider.enable();
        enable.hidden = true;
        status.textContent = "";
      } catch {
        status.textContent = `Google Translate: ${t("networkError")}`;
        enable.disabled = false;
      }
    };
    enable.addEventListener("click", start);
    const original = document.createElement("button");
    original.type = "button";
    original.className = "abp-btn";
    original.dataset.originalLanguage = "en";
    original.textContent = `English · ${t("original")}`;
    const useLocal = (code) => {
      if (provider?.enabled) {
        store.set(code);
        provider.disable();
        // Reload the SAME URL to remove provider DOM wrappers safely. Never
        // try to reverse translated HTML or clear unrelated saved user data.
        location.reload();
      } else { applyLanguage(code); close(); }
    };
    original.addEventListener("click", () => useLocal("en"));
    controls.append(enable, " ", original);
    online.append(heading, note, controls, status);
    if (provider) online.appendChild(provider.host());
    dialog.insertBefore(online, dialog.querySelector("[data-local-language]"));
    document.body.appendChild(dialog);
    const close = () => { provider?.park(); dialog.close(); dialog.remove(); };
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
    dialog.querySelector(".abp-language-dialog__close").addEventListener("click", close);
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    dialog.querySelectorAll("[data-lang]").forEach((button) => button.addEventListener("click", () => {
      useLocal(button.getAttribute("data-lang"));
    }));
    dialog.showModal ? dialog.showModal() : dialog.setAttribute("open", "");
    if (provider?.enabled) start();
  }

  function addPicker() {
    const header = document.querySelector(".md-header__inner");
    if (!header || document.querySelector(".abp-language-btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "abp-language-btn md-header__button";
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.9 15.1 10.4 8.6H8.6l-3.5 9h1.8l.8-2.2h3.6l.8 2.2h1.8l-1-2.5ZM8.3 13.8l1.2-3.3 1.2 3.3H8.3ZM20 4h-6V2h-2v2H6v2h9.9c-.5 1.5-1.4 3-2.5 4.2-.8-.9-1.5-2-2-3.2h-2c.6 1.7 1.5 3.2 2.7 4.5l-2 1.9.7 1.8 2.6-2.4c1.4 1.2 3 2.2 4.8 2.8l.6-1.8c-1.5-.5-2.9-1.3-4.1-2.3C17.2 9.9 18.3 8 18.8 6H20V4Z"/></svg><span></span>';
    button.addEventListener("click", openPicker);
    const search = header.querySelector(".md-search") || header.lastElementChild;
    header.insertBefore(button, search);
  }

  // Translate components inserted after initial load (search, dialogs, lazy tools).
  // Only element additions trigger a pass: translated text-node replacements do not.
  let dynamicTranslationQueued = false;
  const dynamicTranslationObserver = new MutationObserver((records) => {
    if (window.abpGoogleTranslate?.enabled || current === "en") return;
    const hasNewElements = records.some((record) =>
      Array.from(record.addedNodes).some((node) => node.nodeType === Node.ELEMENT_NODE));
    if (!hasNewElements || dynamicTranslationQueued) return;
    dynamicTranslationQueued = true;
    requestAnimationFrame(() => {
      dynamicTranslationQueued = false;
      if (!window.abpGoogleTranslate?.enabled) translate();
    });
  });
  function observeDynamicTranslations() {
    if (document.body) dynamicTranslationObserver.observe(document.body, { childList: true, subtree: true });
  }

  async function initPage() {
    addPicker();
    observeDynamicTranslations();
    await ready;
    if (!window.abpGoogleTranslate?.enabled) applyLanguage(current);
    // Consent is explicit on first use; only then may later pages resume it.
    window.abpGoogleTranslate?.resume().catch(() => {});
  }

  window.abpI18n = { t, translate, applyLanguage, ready, get language() { return current; }, get locales() { return locales; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initPage);
  else initPage();
  if (window.document$ && typeof window.document$.subscribe === "function") window.document$.subscribe(initPage);
})();
