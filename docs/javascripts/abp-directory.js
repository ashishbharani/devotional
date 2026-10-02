/* A–Z directory backed by the same generated works index as Find a Work. */
(() => {
  "use strict";

  const BATCH = () => (window.matchMedia("(max-width: 37.5em)").matches ? 60 : 180);
  const validLetters = new Set([...[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"], "#", "other"]);
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]
  ));
  const t = (key) => window.abpI18n ? window.abpI18n.t(key) : key;

  function bucketFor(title) {
    const first = String(title).trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").charAt(0).toUpperCase();
    if (/[A-Z]/.test(first)) return first;
    if (/[0-9]/.test(first)) return "#";
    return "other";
  }

  async function initDirectory() {
    const root = document.querySelector(".abp-directory");
    if (!root || root.dataset.ready) return;
    root.dataset.ready = "1";

    const indexUrl = new URL(root.dataset.index, location.href);
    const siteRoot = new URL("../", indexUrl);
    const status = root.querySelector("#abp-directory-status");
    const results = root.querySelector("#abp-directory-results");
    const more = root.querySelector("#abp-directory-more");
    const buttons = [...root.querySelectorAll("[data-letter]")];
    const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });
    let data = null;
    let buckets = null;
    let selected = null;
    let hits = [];
    let shown = 0;

    async function load() {
      if (data) return data;
      status.textContent = t("loading");
      const response = await fetch(indexUrl.href);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data = await response.json();
      return data;
    }

    async function ensureBuckets() {
      if (buckets) return buckets;
      const source = await load();
      buckets = Object.fromEntries([..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"].map((letter) => [letter, []]));
      buckets["#"] = [];
      buckets.other = [];
      source.works.forEach((work) => buckets[bucketFor(work[0])].push(work));
      Object.values(buckets).forEach((items) => items.sort((a, b) => collator.compare(a[0], b[0])));
      return buckets;
    }

    function row(work, number) {
      const place = data.places[work[5]];
      const locationLabel = place[2].replace(" › ", " · ");
      const [group, form] = place[2].split(" › ");
      const youtube = work[1] === 0 ? `https://www.youtube.com/results?search_query=${encodeURIComponent(work[0]).replace(/%20/g, "+")}` : work[1];
      const favourite = window.abpFavourites?.buttonHTML({
        id: work[6], title: work[0], category: place[3] || String(place[1]), group,
        language: data.langs[work[2]], form: data.forms[work[3]], tier: work[4],
        location: place[0], youtube,
      }) || "";
      return `<li><a data-work-location="${esc(place[0])}" href="${esc(new URL(place[0], siteRoot).href)}">` +
        `<span class="abp-directory__number" aria-hidden="true">${number}</span>` +
        `<span><b class="abp-work-title">${esc(work[0])}</b>` +
        `<small>${esc(locationLabel)} · ${esc(t("category"))} ${place[1]}</small></span></a>${favourite}</li>`;
    }

    function updateStatus() {
      if (!selected) {
        status.textContent = t("chooseLetter");
        return;
      }
      const label = selected === "other" ? t("other") : selected;
      status.textContent = hits.length
        ? `${label}: ${hits.length.toLocaleString()} ${t("works")} · ${shown.toLocaleString()} ${t("shown")}`
        : `${label}: ${t("noWorks")}`;
      more.textContent = `${t("showMore")} (${Math.max(0, hits.length - shown).toLocaleString()})`;
    }

    function renderMore() {
      const next = hits.slice(shown, shown + BATCH());
      results.insertAdjacentHTML("beforeend", next.map((work, index) => row(work, shown + index + 1)).join(""));
      window.abpFavourites?.paintButtons(results);
      shown += next.length;
      more.hidden = shown >= hits.length;
      if (window.abpI18n) window.abpI18n.translate(results);
      updateStatus();
    }

    async function select(letter, pushHistory = true) {
      if (!validLetters.has(letter)) return;
      selected = letter;
      buttons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.letter === letter)));
      results.innerHTML = "";
      more.hidden = true;
      shown = 0;
      try {
        const grouped = await ensureBuckets();
        hits = grouped[letter];
        renderMore();
      } catch (error) {
        hits = [];
        status.textContent = t("errorIndex");
        return;
      }
      if (pushHistory) {
        const url = new URL(location.href);
        url.searchParams.set("letter", letter);
        history.pushState({ abpLetter: letter }, "", url);
      }
    }

    buttons.forEach((button) => button.addEventListener("click", () => select(button.dataset.letter)));
    more.addEventListener("click", renderMore);
    window.addEventListener("popstate", () => {
      const letter = new URLSearchParams(location.search).get("letter");
      if (letter && validLetters.has(letter)) select(letter, false);
      else {
        selected = null;
        hits = [];
        shown = 0;
        results.innerHTML = "";
        more.hidden = true;
        buttons.forEach((button) => button.setAttribute("aria-pressed", "false"));
        updateStatus();
      }
    });
    document.addEventListener("abp-languagechange", updateStatus);

    const initial = new URLSearchParams(location.search).get("letter");
    if (initial && validLetters.has(initial)) select(initial, false);
    else updateStatus();
  }

  if (window.document$ && typeof window.document$.subscribe === "function") window.document$.subscribe(initDirectory);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", initDirectory);
  else initDirectory();
})();
