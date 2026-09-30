/* ABP Devotional — Progressive Web App layer (iPhone, iPad, Android)
 *
 *  - registers the service worker (sw.js at the site root)
 *  - Android / desktop Chrome: "Install app" button from the beforeinstallprompt event
 *  - iPhone / iPad Safari: step-by-step "Add to Home Screen" guide (iOS has no install prompt)
 *  - installed app: back button in the header (iOS standalone has no browser back button)
 *  - "Save for offline" per category (and for the whole collection) with size + progress
 *  - offline banner, and a toast when a new version of the site is ready
 */
(function () {
  "use strict";

  const PAGES_CACHE = "abp-pages";
  const DISMISS_KEY = "abp-install-dismissed";
  const ROOT = (function () {
    const s = document.querySelector('script[src*="javascripts/abp-pwa.js"]');
    return s ? new URL("../", s.src).href : new URL("./", location.href).href;
  })();
  const url = (path) => new URL(path, ROOT).href;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  };

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/i.test(ua);
  const isStandalone = () =>
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    navigator.standalone === true;

  const fmtMB = (bytes) => (bytes < 1e6 ? `${Math.max(1, Math.round(bytes / 1e3))} KB` : `${(bytes / 1e6).toFixed(bytes < 1e7 ? 1 : 0)} MB`);
  const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };

  /* ------------------------------------------------------------------ toast */
  function toast(html, actions = [], timeoutMs = 0) {
    document.querySelectorAll(".abp-toast").forEach((t) => t.remove());
    const t = el(`<div class="abp-toast" role="status"><div class="abp-toast__msg">${html}</div><div class="abp-toast__actions"></div></div>`);
    actions.forEach(([label, fn, primary]) => {
      const b = el(`<button type="button" class="abp-btn${primary ? " abp-btn--primary" : ""}">${label}</button>`);
      b.addEventListener("click", () => { fn && fn(); t.remove(); });
      t.querySelector(".abp-toast__actions").appendChild(b);
    });
    document.body.appendChild(t);
    document.documentElement.classList.add("abp-has-toast");
    const cleanup = new MutationObserver(() => {
      if (!document.body.contains(t)) { document.documentElement.classList.toggle("abp-has-toast", !!document.querySelector(".abp-toast")); cleanup.disconnect(); }
    });
    cleanup.observe(document.body, { childList: true });
    if (timeoutMs) {
      // WCAG 2.2.1: give readers enough time — pause while hovered or focused
      let left = Math.max(timeoutMs, 8000), started = Date.now(), timer = null;
      const run = () => { started = Date.now(); timer = setTimeout(() => t.remove(), left); };
      const pause = () => { clearTimeout(timer); left -= Date.now() - started; };
      t.addEventListener("mouseenter", pause); t.addEventListener("focusin", pause);
      t.addEventListener("mouseleave", run); t.addEventListener("focusout", run);
      const close = el('<button type="button" class="abp-toast__close" aria-label="Dismiss">×</button>');
      close.addEventListener("click", () => t.remove());
      t.appendChild(close);
      run();
    }
    return t;
  }

  /* ------------------------------------------------------ service worker */
  let swReg = null;
  let updating = false;
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", async () => {
      try {
        swReg = await navigator.serviceWorker.register(url("sw.js"), { scope: ROOT });
        const promptUpdate = (worker) =>
          toast("A new version of the collection is available.", [
            ["Later", null],
            ["Update", () => { updating = true; worker.postMessage({ type: "SKIP_WAITING" }); }, true],
          ]);
        if (swReg.waiting && navigator.serviceWorker.controller) promptUpdate(swReg.waiting);
        swReg.addEventListener("updatefound", () => {
          const w = swReg.installing;
          w && w.addEventListener("statechange", () => {
            if (w.state === "installed" && navigator.serviceWorker.controller) promptUpdate(w);
          });
        });
        // reload only when the user chose "Update" (not when the first-ever service worker takes control)
        let reloaded = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (updating && !reloaded) { reloaded = true; location.reload(); }
        });
        // check for updates when the app comes back to the foreground
        document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") swReg.update().catch(() => {}); });
      } catch (e) {
        console.warn("Service worker registration failed", e);
      }
    });
  }

  /* ------------------------------------------------------ install: Android */
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    renderInstall();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    renderInstall();
    toast("Installed! Open <b>Devotional</b> from your home screen.", [], 5000);
  });

  async function promptInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => {});
    deferredPrompt = null;
    renderInstall();
  }

  function installClicked() {
    if (deferredPrompt) return promptInstall();
    openInstallSheet();
  }

  function openInstallSheet() {
    let body;
    if (isIOS) {
      const safari = /Safari/.test(ua) && !/FxiOS/.test(ua);
      body = safari ? iosSteps() : "<p>Open this page in <b>Safari</b>, then tap <b>Share → Add to Home Screen</b>.</p>";
    } else if (isAndroid) {
      body =
        '<ol class="abp-install__steps"><li>Tap Chrome\'s <b>⋮</b> menu (top right).</li>' +
        "<li>Tap <b>Install app</b> or <b>Add to Home screen</b>.</li><li>Tap <b>Install</b>.</li></ol>" +
        "<p class=\"abp-install__note\">Using Samsung Internet? Tap <b>≡</b> → <b>Add page to</b> → <b>Home screen</b>.</p>";
    } else {
      body =
        '<ol class="abp-install__steps"><li>In Chrome or Edge, click the <b>install icon</b> at the right end of the address bar ' +
        "(or <b>⋮ → Cast, save and share → Install page as app</b>).</li>" +
        "<li>In Safari on Mac: <b>File → Add to Dock</b>.</li></ol>";
    }
    const dlg = el(
      '<dialog class="abp-sheet-dialog" aria-label="Install the app">' +
      '<div class="abp-install__icon"><img src="' + url(isIOS ? "assets/images/apple-touch-icon.png" : "assets/images/icon-192.png") + '" alt="" width="56" height="56"></div>' +
      "<h2>Install the Devotional app</h2>" +
      "<p>Opens full-screen from your home screen, loads instantly and keeps working offline.</p>" +
      body +
      '<form method="dialog"><button class="abp-btn abp-btn--big abp-btn--primary" value="ok">Got it</button></form></dialog>'
    );
    document.body.appendChild(dlg);
    dlg.addEventListener("close", () => dlg.remove());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }

  /* ------------------------------------------------------ install: iPhone / iPad */
  const SHARE_ICON =
    '<svg class="abp-ios-share" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7.5 7.5 12 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 11H6a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  const PLUS_ICON =
    '<svg class="abp-ios-share" viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

  function iosSteps() {
    return (
      '<ol class="abp-install__steps">' +
      `<li>Tap the <b>Share</b> button ${SHARE_ICON} in Safari's toolbar${/iPad/.test(ua) || navigator.maxTouchPoints > 1 && !/iPhone/.test(ua) ? " (top right)" : " (bottom of the screen)"}.</li>` +
      `<li>Scroll down and tap <b>Add to Home Screen</b> ${PLUS_ICON}.</li>` +
      "<li>Tap <b>Add</b>. The app opens full-screen from your home screen and works offline.</li>" +
      "</ol>"
    );
  }

  /* ------------------------------------------------------ install card + header button */
  function renderInstall() {
    const slot = document.getElementById("abp-install");
    const headerBtn = document.querySelector(".abp-install-header");
    const installed = isStandalone();

    if (headerBtn) headerBtn.hidden = installed;
    if (!slot) return;
    if (installed) { slot.hidden = true; return; }

    if (deferredPrompt) {
      slot.innerHTML =
        '<div class="abp-install__icon"><img src="' + url("assets/images/icon-192.png") + '" alt="" width="56" height="56"></div>' +
        '<div class="abp-install__body"><h2>Install the Devotional app</h2>' +
        "<p>Add it to your home screen: opens full-screen, loads instantly and keeps working offline.</p></div>" +
        '<div class="abp-install__cta"><button type="button" class="abp-btn abp-btn--big abp-btn--primary" data-install>Install app</button></div>';
      slot.querySelector("[data-install]").addEventListener("click", promptInstall);
      slot.hidden = false;
    } else if (isIOS) {
      const safari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
      slot.innerHTML =
        '<div class="abp-install__icon"><img src="' + url("assets/images/apple-touch-icon.png") + '" alt="" width="56" height="56"></div>' +
        '<div class="abp-install__body"><h2>Add to your Home Screen</h2>' +
        (safari || /CriOS|EdgiOS/.test(ua)
          ? iosSteps()
          : "<p>Open this page in <b>Safari</b>, then use <b>Share → Add to Home Screen</b>.</p>") +
        "</div>" +
        '<div class="abp-install__cta"><button type="button" class="abp-btn abp-btn--big abp-btn--primary" data-install>Show me how</button></div>';
      slot.querySelector("[data-install]").addEventListener("click", openInstallSheet);
      slot.hidden = false;
    } else if (isAndroid) {
      slot.innerHTML =
        '<div class="abp-install__icon"><img src="' + url("assets/images/icon-192.png") + '" alt="" width="56" height="56"></div>' +
        '<div class="abp-install__body"><h2>Install the Devotional app</h2>' +
        "<p>In Chrome, open the <b>⋮</b> menu and tap <b>Install app</b> (or <b>Add to Home screen</b>).</p></div>" +
        '<div class="abp-install__cta"><button type="button" class="abp-btn abp-btn--big abp-btn--primary" data-install>Install app</button></div>';
      slot.querySelector("[data-install]").addEventListener("click", installClicked);
      slot.hidden = false;
    } else {
      slot.innerHTML =
        '<div class="abp-install__icon"><img src="' + url("assets/images/icon-192.png") + '" alt="" width="56" height="56"></div>' +
        '<div class="abp-install__body"><h2>Install the Devotional app</h2>' +
        "<p>Works on iPhone, iPad, Android and computers — full-screen and available offline.</p></div>" +
        '<div class="abp-install__cta"><button type="button" class="abp-btn abp-btn--big abp-btn--primary" data-install>Install app</button></div>';
      slot.querySelector("[data-install]").addEventListener("click", installClicked);
      slot.hidden = false;
    }
  }

  /* one-time iOS hint on other pages (the home page always shows the card) */
  function maybeIosBanner() {
    if (!isIOS || isStandalone() || document.getElementById("abp-install")) return;
    const last = +store.get(DISMISS_KEY) || 0;
    if (Date.now() - last < 1000 * 60 * 60 * 24 * 21) return;
    const t = toast(`<b>Install this app:</b> tap ${SHARE_ICON} <b>Share</b>, then <b>Add to Home Screen</b>.`, [
      ["Not now", () => store.set(DISMISS_KEY, String(Date.now()))],
    ]);
    t.classList.add("abp-toast--ios");
  }

  function headerButtons() {
    const inner = document.querySelector(".md-header__inner");
    if (!inner) return;
    if (!inner.querySelector(".abp-install-header")) {
      const b = el('<button type="button" class="abp-install-header md-header__button" title="Install app" aria-label="Install app" hidden>' +
        '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M5 20h14v-2H5v2zM19 9h-4V3H9v6H5l7 7 7-7z"/></svg><span>Install app</span></button>');
      b.addEventListener("click", installClicked);
      const search = inner.querySelector(".md-search") || inner.lastElementChild;
      inner.insertBefore(b, search);
    }
    // installed app: add a back button (iOS standalone has no browser chrome)
    if (isStandalone() && !inner.querySelector(".abp-back")) {
      const back = el('<button type="button" class="abp-back md-header__button" aria-label="Back">' +
        '<svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg></button>');
      back.addEventListener("click", () => (history.length > 1 ? history.back() : (location.href = ROOT)));
      inner.insertBefore(back, inner.firstElementChild);
    }
    if (isStandalone()) {
      const onHome = new URL(location.href).pathname === new URL(ROOT).pathname;
      const back = inner.querySelector(".abp-back");
      if (back) back.hidden = onHome;
    }
  }

  /* ------------------------------------------------------ offline banner */
  function offlineBanner() {
    let bar = document.querySelector(".abp-offline-bar");
    if (!bar) {
      bar = el('<div class="abp-offline-bar" role="status" hidden>You are offline — showing saved pages.</div>');
      document.body.appendChild(bar);
    }
    const update = () => { bar.hidden = navigator.onLine; document.documentElement.classList.toggle("abp-is-offline", !navigator.onLine); };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    update();
  }

  /* ------------------------------------------------------ save for offline */
  let packsPromise = null;
  const loadPacks = () => (packsPromise = packsPromise || fetch(url("assets/offline-packs.json")).then((r) => r.json()));

  function packFor(id, packs) {
    if (id !== "all") return packs[id] && { ...packs[id], pages: packs[id].pages.map(url) };
    const pages = [], seen = new Set();
    let bytes = 0;
    Object.values(packs).forEach((p) => { bytes += p.bytes; p.pages.forEach((u) => { if (!seen.has(u)) { seen.add(u); pages.push(url(u)); } }); });
    return { title: "the whole collection", pages, bytes };
  }

  async function countSaved(pages) {
    const cache = await caches.open(PAGES_CACHE);
    const keys = new Set((await cache.keys()).map((r) => r.url));
    return pages.filter((u) => keys.has(u)).length;
  }

  async function estimate() {
    try {
      if (!navigator.storage || !navigator.storage.estimate) return null;
      const { usage, quota } = await navigator.storage.estimate();
      return { usage, quota };
    } catch (e) { return null; }
  }

  async function renderOffline(box) {
    if (!("caches" in window) || !("serviceWorker" in navigator)) return;
    let packs;
    try { packs = await loadPacks(); } catch (e) { return; }
    const id = box.dataset.pack;
    const pack = packFor(id, packs);
    if (!pack) return;
    const saved = await countSaved(pack.pages);
    const total = pack.pages.length;
    const done = saved === total;
    const label = id === "all" ? "the whole collection" : "this category";
    box.innerHTML =
      '<div class="abp-offline__icon" aria-hidden="true">' +
      (done ? '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>'
            : '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>') +
      "</div>" +
      '<div class="abp-offline__body">' +
      `<b>${done ? "Saved for offline" : "Read offline"}</b>` +
      `<span class="abp-offline__meta" role="status" aria-live="polite">${done
        ? `All ${total.toLocaleString()} pages of ${label} are on this device.`
        : `Save ${label} (${total.toLocaleString()} pages, ≈ ${fmtMB(pack.bytes)}) to read without internet${saved ? ` — ${saved.toLocaleString()} already saved` : ""}.`}</span>` +
      '<progress hidden max="1" value="0" aria-label="Saving pages for offline use"></progress>' +
      "</div>" +
      '<div class="abp-offline__cta">' +
      (done
        ? '<button type="button" class="abp-btn" data-act="refresh">Refresh</button><button type="button" class="abp-btn" data-act="remove">Remove</button>'
        : '<button type="button" class="abp-btn abp-btn--primary" data-act="save">Save for offline</button>') +
      "</div>";
    box.hidden = false;
    box.querySelectorAll("[data-act]").forEach((b) =>
      b.addEventListener("click", () => (b.dataset.act === "remove" ? removePack(box, pack) : savePack(box, pack, b.dataset.act === "refresh")))
    );
  }

  async function savePack(box, pack, refresh) {
    if (!navigator.onLine) { toast("You're offline. Connect to the internet to save pages.", [], 4000); return; }
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
    const est = await estimate();
    if (est && est.quota && est.quota - est.usage < pack.bytes * 1.3) {
      toast(`Not enough free space on this device for ${fmtMB(pack.bytes)}.`, [], 5000);
      return;
    }
    const cache = await caches.open(PAGES_CACHE);
    const have = refresh ? new Set() : new Set((await cache.keys()).map((r) => r.url));
    const todo = pack.pages.filter((u) => !have.has(u));
    const bar = box.querySelector("progress");
    const meta = box.querySelector(".abp-offline__meta");
    const btns = box.querySelectorAll("button");
    btns.forEach((b) => (b.disabled = true));
    bar.hidden = false;
    bar.max = todo.length || 1;
    let n = 0, failed = 0, i = 0;
    const worker = async () => {
      while (i < todo.length) {
        const u = todo[i++];
        try {
          const r = await fetch(u, { cache: "no-cache" });
          if (!r.ok) throw new Error(r.status);
          await cache.put(u, r);
        } catch (e) { failed++; }
        n++;
        bar.value = n;
        meta.textContent = `Saving… ${n.toLocaleString()} of ${todo.length.toLocaleString()} pages`;
      }
    };
    await Promise.all(Array.from({ length: 4 }, worker));
    if (failed) toast(`${failed} page${failed > 1 ? "s" : ""} could not be saved. Tap Save again to retry.`, [], 5000);
    else toast(`Saved — ${pack.title} is available offline.`, [], 3500);
    renderOffline(box);
  }

  async function removePack(box, pack) {
    const cache = await caches.open(PAGES_CACHE);
    await Promise.all(pack.pages.map((u) => cache.delete(u)));
    toast("Removed the saved copy from this device.", [], 3000);
    renderOffline(box);
  }

  /* offline page: list categories that have saved pages */
  async function renderSavedList() {
    const box = document.getElementById("abp-saved");
    if (!box || !("caches" in window)) return;
    const cats = JSON.parse(box.dataset.cats || "{}");
    const keys = [];
    for (const name of await caches.keys()) {
      if (!name.startsWith("abp-")) continue;
      const c = await caches.open(name);
      (await c.keys()).forEach((r) => keys.push(r.url));
    }
    const counts = {};
    keys.forEach((u) => {
      const path = u.slice(ROOT.length);
      const dir = Object.keys(cats).find((d) => path.startsWith(d));
      if (dir) counts[dir] = (counts[dir] || 0) + 1;
    });
    const rows = Object.keys(cats)
      .filter((d) => counts[d])
      .map((d) => `<a class="abp-catbar" href="${url(d)}"><span class="abp-catbar__title">${cats[d]}</span><span class="abp-catbar__stats">${counts[d]} saved page${counts[d] > 1 ? "s" : ""}</span></a>`);
    box.innerHTML = rows.length
      ? `<h2 class="abp-shelf">Saved on this device</h2><nav class="abp-catbars abp-catbars--saved">${rows.join("")}</nav>`
      : '<p class="abp-lede">Nothing is saved yet. When you are online, open a category and tap <b>Save for offline</b>.</p>';
  }

  /* ------------------------------------------------------ per-page init (Material instant navigation) */
  function initPage() {
    headerButtons();
    renderInstall();
    //
   document.querySelectorAll(".abp-offline[data-pack]").forEach(renderOffline);
    renderSavedList();
  }

  function initOnce() {
    offlineBanner();
    if (isStandalone()) document.documentElement.classList.add("abp-standalone");
    setTimeout(maybeIosBanner, 2500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initOnce);
  else initOnce();
  if (window.document$ && typeof window.document$.subscribe === "function") window.document$.subscribe(initPage);
  else document.addEventListener("DOMContentLoaded", initPage);
})();
