/* ABP Devotional theme — client helpers.
 * The "Find a Work" page loads assets/works-index.json (built by hooks/generate.py)
 * and filters all works in the browser. Works with Material's instant navigation.
 */
(function () {
  "use strict";
  const YT = "https://www.youtube.com/results?search_query=";
  const LIMIT = 300;
  let cache = null;

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fold = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  async function loadIndex(url) {
    if (cache) return cache;
    const res = await fetch(url);
    const data = await res.json();
    data.works.forEach((w) => (w.key = fold(w[0])));
    cache = data;
    return data;
  }

  async function initFinder() {
    const root = document.querySelector(".abp-finder");
    if (!root || root.dataset.ready) return;
    root.dataset.ready = "1";
    const indexUrl = new URL(root.dataset.index, location.href);
    const siteRoot = new URL("../", indexUrl);
    const $ = (id) => root.querySelector("#" + id);
    const q = $("abp-q"), cat = $("abp-cat"), lang = $("abp-lang"), tier = $("abp-tier");
    const status = $("abp-status"), out = $("abp-results");

    let data;
    try {
      data = await loadIndex(indexUrl.href);
    } catch (e) {
      status.textContent = "Could not load the works index.";
      return;
    }
    const langOrder = data.langs.map((l, i) => [l, i]).sort((a, b) => a[0].localeCompare(b[0]));
    lang.insertAdjacentHTML("beforeend", langOrder.map(([l, i]) => `<option value="${i}">${esc(l || "—")}</option>`).join(""));

    const params = new URLSearchParams(location.search);
    if (params.get("q")) q.value = params.get("q");

    function run() {
      const terms = fold(q.value.trim()).split(/\s+/).filter(Boolean);
      const c = cat.value ? +cat.value : null;
      const l = lang.value !== "" ? +lang.value : null;
      const t = tier.value || null;
      if (!terms.length && c === null && l === null && !t) {
        status.textContent = `${data.works.length.toLocaleString()} works indexed — start typing to search.`;
        out.innerHTML = "";
        return;
      }
      const hits = [];
      let total = 0;
      for (const w of data.works) {
        if (l !== null && w[2] !== l) continue;
        if (t && w[4] !== t) continue;
        const place = data.places[w[5]];
        if (c !== null && place[1] !== c) continue;
        if (terms.length && !terms.every((x) => w.key.includes(x))) continue;
        total++;
        if (hits.length < LIMIT) hits.push(w);
      }
      status.textContent = total
        ? `${total.toLocaleString()} matching works${total > LIMIT ? ` — showing the first ${LIMIT}` : ""}.`
        : "No works match. Try fewer words or a different spelling.";
      out.innerHTML = hits
        .map((w, i) => {
          const place = data.places[w[5]];
          const href = w[1] === 0 ? YT + encodeURIComponent(w[0]).replace(/%20/g, "+") : w[1];
          const [grp, form] = place[2].split(" › ");
          return (
            `<tr><td class="n">${i + 1}</td>` +
            `<td class="w"><a href="${esc(href)}" target="_blank" rel="noopener"><span class="abp-play" aria-hidden="true"></span>${esc(w[0])}</a></td>` +
            `<td class="lang" data-label="Language">${esc(data.langs[w[2]] || "—")}</td>` +
            `<td class="form" data-label="Form">${esc(data.forms[w[3]] || "—")}</td>` +
            `<td class="tier" data-label="Tier"><span class="abp-tier abp-tier--${esc((w[4] || "").toLowerCase())}">${esc(w[4] || "—")}</span></td>` +
            `<td class="where" data-label="Found in"><a href="${new URL(place[0], siteRoot).href}">${esc(grp)}</a>` +
            `<small>${place[1]}. ${esc(form || "")}</small></td></tr>`
          );
        })
        .join("");
    }

    let timer;
    const debounced = () => { clearTimeout(timer); timer = setTimeout(run, 140); };
    q.addEventListener("input", debounced);
    [cat, lang, tier].forEach((el) => el.addEventListener("change", run));
    run();
    if (!("ontouchstart" in window)) q.focus();
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(initFinder);
  } else {
    document.addEventListener("DOMContentLoaded", initFinder);
  }
})();
