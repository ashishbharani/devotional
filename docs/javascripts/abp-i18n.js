/* Central interface translation catalogue plus safe sacred-title transliteration. */
(() => {
  "use strict";

  const STORAGE_KEY = "abp-language";
  // Retire only Website Translator state. Never clear auth, favourites or Japa.
  try { localStorage.removeItem("abp-google-translate-consent-v1"); } catch { /* blocked storage */ }
  const retiredBase = new URL("../", document.currentScript.src).pathname;
  for (const path of new Set(["/", retiredBase])) {
    for (const domain of ["", `; domain=${location.hostname}`, `; domain=.${location.hostname}`]) {
      document.cookie = `googtrans=; Max-Age=0; path=${path}${domain}; SameSite=Lax`;
    }
  }
  const order = ["en", "hi", "mr", "gu", "bn", "pa", "te", "kn", "ml", "ta"];
  const localeNames = {
    en: "English", hi: "हिन्दी", mr: "मराठी", gu: "ગુજરાતી", bn: "বাংলা",
    pa: "ਪੰਜਾਬੀ", te: "తెలుగు", kn: "ಕನ್ನಡ", ml: "മലയാളം", ta: "தமிழ்",
  };
  const FALLBACK = {
    localTranslationScope: "Choose an in-site language. Untranslated passages retain their original wording; full-text coverage is being expanded.",
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
  let catalogueLoaded = false;
  let phrases = new Map();
  const plainText = new WeakMap(), originalAttributes = new WeakMap();
  const normalized = (value) => value.replace(/\s+/g, " ").trim().toLocaleLowerCase("en");
  const setText = (node, value) => { if (node.textContent !== value) node.textContent = value; };
  const protectedText = 'script,style,noscript,svg,code,pre,input,textarea,option:not([value]),[contenteditable],.abp-work-title,.abp-work-original,[data-transliterate-ui],[data-category-name],.abp-account,#abp-account-summary,#abp-favourites-list,[lang="sa"],.abp-language-grid,.abp-language-btn';
  function translatePlainText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      if (!parent || parent.closest(protectedText + ',[data-i18n],[data-i18n-value],[data-i18n-all]')) continue;
      const previous = plainText.get(node);
      const source = previous && node.nodeValue === previous.rendered ? previous.source : node.nodeValue;
      const entry = phrases.get(normalized(source));
      if (!entry) continue;
      const value = current === "en" ? source : source.match(/^\s*/)[0] + (entry[current] || source.trim()) + source.match(/\s*$/)[0];
      if (node.nodeValue !== value) node.nodeValue = value;
      plainText.set(node, {source, rendered: value});
    }
    root.querySelectorAll("[aria-label],[placeholder],[title],[alt]").forEach((element) => {
      // Static accessible labels may translate; input/textarea values never do.
      if (element.closest(protectedText.replace("input,textarea,", ""))) return;
      const saved = originalAttributes.get(element) || {};
      for (const attribute of ["aria-label", "placeholder", "title", "alt"]) {
        if (element.hasAttribute("data-i18n-" + (attribute === "aria-label" ? "aria" : attribute))) continue;
        const value = element.getAttribute(attribute);
        if (value === null) continue;
        const previous = saved[attribute];
        const source = previous && value === previous.rendered ? previous.source : value;
        const entry = phrases.get(normalized(source));
        if (!entry) continue;
        const rendered = current === "en" ? source : entry[current] || source;
        if (value !== rendered) element.setAttribute(attribute, rendered);
        saved[attribute] = {source, rendered};
      }
      originalAttributes.set(element, saved);
    });
  }
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
      locales = Object.fromEntries(order.map((code) => {
        const strings = Object.fromEntries(sections.flatMap((section) =>
          (section.keys || []).map((key, index) => [key, section.values?.[code]?.[index] || section.values?.en?.[index]])
        ));
        return [code, { name: data.localeNames?.[code] || localeNames[code], strings }];
      }));
      categoryNames = data.categoryNames || {};
      phrases = new Map();
      for (const section of sections) (section.keys || []).forEach((key, index) => {
        const source = section.values?.en?.[index];
        if (source) phrases.set(normalized(source), Object.fromEntries(order.map(code => [code, locales[code].strings[key]])));
      });
      for (const [source, translations] of Object.entries(data.textTranslations || {})) {
        phrases.set(normalized(source), {en: source, ...translations});
      }
      catalogueLoaded = true;
    })
    .catch((error) => console.warn("Interface translation catalogue could not be loaded", error));

  function transliterateText(node, explicit) {
    const engine = window.abpTransliterate;
    const original = originalText.get(node) || explicit || node.textContent.trim();
    originalText.set(node, original);
    if (!engine || current === "en" || !engine.languages.has(current)) {
      setText(node, original);
      node.removeAttribute("lang");
      node.removeAttribute("title");
      return;
    }
    setText(node, engine.transliterate(original, current));
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
        setText(node, original);
        node.removeAttribute("lang");
        if (source) source.remove();
        return;
      }
      const converted = engine.transliterate(original, current);
      setText(node, converted);
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
      setText(source, `${t("original")}: ${original}`);
    });
  }

  function translate(root = document) {
    root.querySelectorAll(".md-nav__link").forEach((node) => {
      const key = chromeLabels.get(node.textContent.trim());
      if (key) node.setAttribute("data-i18n", key);
    });
    root.querySelectorAll("[data-i18n]").forEach((node) => {
      const value = t(node.getAttribute("data-i18n"));
      if (value) setText(node, value);
    });
    root.querySelectorAll("[data-i18n-aria]").forEach((node) => node.setAttribute("aria-label", t(node.getAttribute("data-i18n-aria"))));
    root.querySelectorAll("[data-i18n-title]").forEach((node) => node.setAttribute("title", t(node.getAttribute("data-i18n-title"))));
    root.querySelectorAll("[data-i18n-placeholder]").forEach((node) => node.setAttribute("placeholder", t(node.getAttribute("data-i18n-placeholder"))));
    root.querySelectorAll("[data-i18n-label]").forEach((node) => node.setAttribute("data-label", t(node.getAttribute("data-i18n-label"))));
    root.querySelectorAll("[data-i18n-value]").forEach((node) => { setText(node, t(node.getAttribute("data-i18n-value"))); });
    root.querySelectorAll("[data-i18n-all]").forEach((node) => { setText(node, `${t("all")} ${t(node.getAttribute("data-i18n-all"))}`); });
    root.querySelectorAll("[data-category-name]").forEach((node) => {
      const number = Number(node.getAttribute("data-category-name"));
      const translated = categoryNames[current]?.[number - 1];
      if (translated) {
        const original = originalText.get(node) || node.textContent.trim();
        originalText.set(node, original);
        setText(node, translated);
        node.lang = current;
        node.title = current === "en" ? "" : `${t("original")}: ${original}`;
      } else transliterateText(node);
    });
    root.querySelectorAll("[data-transliterate-ui]").forEach((node) => transliterateText(node));
    translateWorkTitles(root);
    translatePlainText(root);
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
    dialog.setAttribute("aria-labelledby", "abp-language-title");
    dialog.innerHTML =
      `<div class="abp-language-dialog__head"><h2 id="abp-language-title">${t("language")}</h2>` +
      `<button type="button" class="abp-language-dialog__close" aria-label="${t("close")}">×</button></div>` +
      `<p class="abp-language-dialog__note">${t("localTranslationScope")}</p>` +
      '<div class="abp-language-grid">' + order.map((code) =>
        `<button type="button" lang="${code}" dir="ltr" data-lang="${code}"${code === current ? ' aria-current="true"' : ""}>` +
        `<span>${locales[code].name}</span></button>`
      ).join("") + "</div>" +
      `<p class="abp-language-dialog__note">${t("titleTransliterationNote")}</p>`;
    document.body.appendChild(dialog);
    const close = () => { dialog.close(); dialog.remove(); };
    dialog.addEventListener("cancel", (event) => { event.preventDefault(); close(); });
    dialog.querySelector(".abp-language-dialog__close").addEventListener("click", close);
    dialog.addEventListener("click", (event) => { if (event.target === dialog) close(); });
    dialog.querySelectorAll("[data-lang]").forEach((button) => button.addEventListener("click", () => {
      applyLanguage(button.dataset.lang);
      close();
    }));
    dialog.showModal ? dialog.showModal() : dialog.setAttribute("open", "");
  }

  function addPicker() {
    const header = document.querySelector(".md-header__inner");
    if (!header || document.querySelector(".abp-language-btn")) return;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "abp-language-btn md-header__button";
    button.disabled = !catalogueLoaded;
    button.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.9 15.1 10.4 8.6H8.6l-3.5 9h1.8l.8-2.2h3.6l.8 2.2h1.8l-1-2.5ZM8.3 13.8l1.2-3.3 1.2 3.3H8.3ZM20 4h-6V2h-2v2H6v2h9.9c-.5 1.5-1.4 3-2.5 4.2-.8-.9-1.5-2-2-3.2h-2c.6 1.7 1.5 3.2 2.7 4.5l-2 1.9.7 1.8 2.6-2.4c1.4 1.2 3 2.2 4.8 2.8l.6-1.8c-1.5-.5-2.9-1.3-4.1-2.3C17.2 9.9 18.3 8 18.8 6H20V4Z"/></svg><span></span>';
    button.setAttribute("aria-label", FALLBACK.language);
    button.querySelector("span").textContent = localeNames[current];
    button.addEventListener("click", openPicker);
    const search = header.querySelector(".md-search") || header.lastElementChild;
    header.insertBefore(button, search);
  }

  // Translate components inserted after initial load (search, dialogs, lazy tools).
  // Text-only updates also matter. Idempotent writes prevent observer loops.
  let dynamicTranslationQueued = false;
  const dynamicTranslationObserver = new MutationObserver((records) => {
    if (current === "en") return;
    const hasNewElements = records.some((record) => record.type === "characterData" || record.addedNodes.length);
    if (!hasNewElements || dynamicTranslationQueued) return;
    dynamicTranslationQueued = true;
    requestAnimationFrame(() => {
      dynamicTranslationQueued = false;
      translate();
    });
  });
  function observeDynamicTranslations() {
    if (document.body) dynamicTranslationObserver.observe(document.body, { childList: true, characterData: true, subtree: true });
  }

  async function initPage() {
    addPicker();
    observeDynamicTranslations();
    await ready;
    document.querySelectorAll(".abp-language-btn").forEach(button => { button.disabled = !catalogueLoaded; });
    if (catalogueLoaded) applyLanguage(current);
    else {
      current = "en";
      document.documentElement.lang = "en";
      document.querySelectorAll(".abp-language-btn").forEach(button => {
        button.title = "Language catalogue unavailable. Please reload.";
        button.setAttribute("aria-label", button.title);
      });
    }
  }

  window.abpI18n = { t, translate, applyLanguage, ready, get language() { return current; }, get locales() { return locales; } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initPage);
  else initPage();
  if (window.document$ && typeof window.document$.subscribe === "function") window.document$.subscribe(initPage);
})();
