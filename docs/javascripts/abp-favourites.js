/* Canonical-ID favourites: IndexedDB guest/cache storage plus optional Firestore sync. */
(() => {
  "use strict";

  const DB_NAME = "udhc-favourites";
  const DB_VERSION = 1;
  const GUEST = "guest";
  const LAST_SCOPE = "udhc-last-favourite-scope";
  const esc = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]
  ));
  const t = (key) => window.abpI18n ? window.abpI18n.t(key) : key;
  let currentUser = null;
  let active = new Map();
  let dbPromise = null;

  function openDb() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        const favourites = db.createObjectStore("favourites", { keyPath: "key" });
        favourites.createIndex("scope", "scope", { unique: false });
        const pending = db.createObjectStore("pending", { keyPath: "key" });
        pending.createIndex("scope", "scope", { unique: false });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    return dbPromise;
  }

  async function storeRequest(storeName, mode, operation) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const result = operation(tx.objectStore(storeName));
      tx.oncomplete = () => resolve(result?.result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  const scope = () => currentUser?.uid || GUEST;
  const keyFor = (owner, id) => `${owner}:${id}`;
  const getAll = (store, owner) => storeRequest(store, "readonly", (objectStore) => objectStore.index("scope").getAll(owner));
  const put = (store, value) => storeRequest(store, "readwrite", (objectStore) => objectStore.put(value));
  const remove = (store, key) => storeRequest(store, "readwrite", (objectStore) => objectStore.delete(key));

  async function replaceScope(owner, records) {
    const existing = await getAll("favourites", owner);
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("favourites", "readwrite");
      const store = tx.objectStore("favourites");
      existing.forEach((item) => store.delete(item.key));
      records.forEach((record) => store.put({ ...record, scope: owner, key: keyFor(owner, record.id) }));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  async function clearScope(storeName, owner) {
    const items = await getAll(storeName, owner);
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      items.forEach((item) => tx.objectStore(storeName).delete(item.key));
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }

  function cleanRecord(record) {
    return {
      id: String(record.id || ""), title: String(record.title || ""),
      category: String(record.category || ""), group: String(record.group || ""),
      language: String(record.language || ""), form: String(record.form || ""),
      tier: String(record.tier || ""), location: String(record.location || ""),
      youtube: String(record.youtube || ""), savedAt: Number(record.savedAt || Date.now()),
    };
  }

  function buttonHTML(record) {
    const fields = ["id", "title", "category", "group", "language", "form", "tier", "location", "youtube"];
    const attrs = fields.map((field) => ` data-${field === "id" ? "work-id" : field}="${esc(record[field])}"`).join("");
    return `<button type="button" class="abp-favourite"${attrs} aria-pressed="false" aria-label="${esc(t("addFavourite"))}"><span aria-hidden="true">♡</span></button>`;
  }

  function recordFromButton(button) {
    const row = button.closest("tr");
    const table = button.closest("table");
    const link = row?.querySelector("th.w a") || button.closest("li")?.querySelector("a[data-work-location]");
    const cell = (name) => row?.querySelector(`.${name}`)?.textContent.trim() || "";
    return cleanRecord({
      id: button.dataset.workId,
      title: button.dataset.title || row?.querySelector(".abp-work-title")?.textContent.trim() || "",
      category: button.dataset.category || table?.dataset.category || "",
      group: button.dataset.group || table?.dataset.group || "",
      language: button.dataset.language || cell("lang"),
      form: button.dataset.form || table?.dataset.form || cell("form"),
      tier: button.dataset.tier || cell("tier"),
      location: button.dataset.location || link?.dataset.workLocation || "",
      youtube: button.dataset.youtube || link?.href || "",
    });
  }

  function paintButtons(root = document) {
    root.querySelectorAll(".abp-favourite[data-work-id]").forEach((button) => {
      const saved = active.has(button.dataset.workId);
      button.setAttribute("aria-pressed", String(saved));
      button.setAttribute("aria-label", t(saved ? "removeFavourite" : "addFavourite"));
      button.title = t(saved ? "removeFavourite" : "addFavourite");
      button.querySelector("span").textContent = saved ? "♥" : "♡";
    });
  }

  function changed() {
    paintButtons();
    document.dispatchEvent(new CustomEvent("abp-favouriteschange", { detail: { count: active.size } }));
  }

  async function loadActive() {
    active = new Map((await getAll("favourites", scope())).map((item) => [item.id, cleanRecord(item)]));
    changed();
    renderPage();
  }

  async function queue(operation) {
    const owner = scope();
    if (owner === GUEST) return;
    await put("pending", { ...operation, scope: owner, key: keyFor(owner, operation.id) });
  }

  async function toggle(record) {
    const owner = scope();
    const key = keyFor(owner, record.id);
    if (active.has(record.id)) {
      active.delete(record.id);
      await remove("favourites", key);
      await queue({ id: record.id, action: "delete" });
    } else {
      const saved = cleanRecord({ ...record, savedAt: Date.now() });
      active.set(saved.id, saved);
      await put("favourites", { ...saved, scope: owner, key });
      await queue({ id: saved.id, action: "set", record: saved });
    }
    changed();
    renderPage();
    if (currentUser && navigator.onLine) flush().catch(() => {});
  }

  async function flush() {
    if (!currentUser || !navigator.onLine) return;
    const operations = await getAll("pending", currentUser.uid);
    if (!operations.length) return;
    await window.abpFirebase.writeFavourites(currentUser.uid, operations);
    await clearScope("pending", currentUser.uid);
  }

  async function mergeAccount(user) {
    currentUser = user;
    const guest = (await getAll("favourites", GUEST)).map(cleanRecord);
    const cached = (await getAll("favourites", user.uid)).map(cleanRecord);
    const pending = await getAll("pending", user.uid);
    const merged = new Map([...cached, ...guest].map((record) => [record.id, record]));
    let remoteLoaded = false;
    try {
      const remote = await window.abpFirebase.readFavourites(user.uid);
      remote.forEach((record) => { if (!merged.has(record.id)) merged.set(record.id, cleanRecord(record)); });
      remoteLoaded = true;
    } catch (error) { /* local cache stays fully usable offline */ }
    pending.forEach((operation) => {
      if (operation.action === "delete") merged.delete(operation.id);
      else merged.set(operation.id, cleanRecord(operation.record));
    });
    await replaceScope(user.uid, [...merged.values()]);
    active = merged;
    changed();
    renderPage();
    const unionWrites = [...merged.values()].map((record) => ({ id: record.id, action: "set", record }));
    if (remoteLoaded && navigator.onLine) {
      await window.abpFirebase.writeFavourites(user.uid, [...unionWrites, ...pending.filter((item) => item.action === "delete")]);
      await clearScope("pending", user.uid);
      await clearScope("favourites", GUEST);
    } else {
      for (const operation of unionWrites) await put("pending", { ...operation, scope: user.uid, key: keyFor(user.uid, operation.id) });
    }
  }

  function optionValues(records, field) {
    return [...new Set(records.map((record) => record[field]).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }

  function renderPage() {
    const root = document.querySelector("#abp-favourites-page");
    if (!root) return;
    const records = [...active.values()].sort((a, b) => b.savedAt - a.savedAt);
    const controls = {
      query: root.querySelector("#abp-favourites-search"), category: root.querySelector("#abp-favourites-category"),
      language: root.querySelector("#abp-favourites-language"), form: root.querySelector("#abp-favourites-form"),
    };
    for (const field of ["category", "language", "form"]) {
      const select = controls[field];
      const selected = select.value;
      const allKey = field === "category" ? "allCategories" : field === "language" ? "allLanguages" : "allForms";
      select.innerHTML = `<option value="" data-i18n="${allKey}">${esc(t(allKey))}</option>` +
        optionValues(records, field).map((value) => `<option value="${esc(value)}">${esc(value)}</option>`).join("");
      select.value = selected;
    }
    const query = controls.query.value.trim().toLocaleLowerCase();
    const shown = records.filter((record) => (!query || `${record.title} ${record.category} ${record.group} ${record.language} ${record.form} ${record.tier}`.toLocaleLowerCase().includes(query)) &&
      ["category", "language", "form"].every((field) => !controls[field].value || record[field] === controls[field].value));
    const list = root.querySelector("#abp-favourites-list");
    list.innerHTML = shown.map((record) => {
      const location = new URL(record.location, window.abpSiteRoot).href;
      return `<li><div><a class="abp-work-title" data-work-location="${esc(location)}" href="${esc(location)}">${esc(record.title)}</a>` +
        `<small>${esc([record.category, record.group, record.language, record.form, record.tier].filter(Boolean).join(" · "))}</small></div>` +
        `<div class="abp-favourites-page__actions"><a class="abp-btn" href="${esc(record.youtube)}" target="_blank" rel="noopener">${esc(t("listen"))}</a>` +
        buttonHTML(record) + `</div></li>`;
    }).join("");
    window.abpI18n?.translate(root);
    root.querySelector("#abp-favourites-status").textContent = `${shown.length.toLocaleString()} ${t("favourites")}`;
    root.querySelector("#abp-favourites-empty").hidden = shown.length > 0;
    paintButtons(root);
  }

  function initPage() {
    paintButtons();
    const root = document.querySelector("#abp-favourites-page");
    if (!root || root.dataset.ready) { renderPage(); return; }
    root.dataset.ready = "1";
    root.querySelectorAll("input,select").forEach((control) => control.addEventListener("input", renderPage));
    renderPage();
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest(".abp-favourite[data-work-id]");
    if (!button) return;
    event.preventDefault();
    toggle(recordFromButton(button)).catch(() => {});
  });
  document.addEventListener("abp-languagechange", () => { paintButtons(); renderPage(); });
  window.addEventListener("online", () => flush().catch(() => {}));
  window.abpFirebase.observe((state) => {
    if (!state.ready) return;
    if (state.user) {
      try { localStorage.setItem(LAST_SCOPE, state.user.uid); } catch (error) { /* storage unavailable */ }
      mergeAccount(state.user).catch(() => loadActive());
    } else if (state.error) {
      let lastUid = null;
      try { lastUid = localStorage.getItem(LAST_SCOPE); } catch (error) { /* storage unavailable */ }
      currentUser = lastUid ? { uid: lastUid, offline: true } : null;
      loadActive().catch(() => {});
    } else {
      currentUser = null;
      try { localStorage.removeItem(LAST_SCOPE); } catch (error) { /* storage unavailable */ }
      loadActive().catch(() => {});
    }
  });
  window.abpFavourites = { buttonHTML, paintButtons, renderPage };
  if (window.document$?.subscribe) window.document$.subscribe(initPage);
  else document.addEventListener("DOMContentLoaded", initPage);
})();
