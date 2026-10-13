/* ABP Devotional theme — client helpers.
 * The "Find a Work" page loads assets/works-index.json (built by hooks/generate.py)
 * and filters all works in the browser. Works with Material's instant navigation.
 */
(function () {
  "use strict";
  const YT = "https://www.youtube.com/results?search_query=";
  // smaller batches on phones keep the DOM light; "Show more" appends the next batch
  const BATCH = () => (window.matchMedia("(max-width: 37.5em)").matches ? 60 : 200);
  const t = (key) => (window.abpI18n ? window.abpI18n.t(key) : key);

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const highlight = (title, query) => {
    const words = query.match(/[\p{L}\p{M}\p{N}]+/gu) || [];
    if (!words.length) return esc(title);
    const pattern = new RegExp('(' + words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'giu');
    return title.split(pattern).map((part, i) => i % 2 ? '<mark>' + esc(part) + '</mark>' : esc(part)).join('');
  };

  async function initFinder() {
    const root = document.querySelector(".abp-finder");
    if (!root || root.dataset.ready) return;
    root.dataset.ready = "1";
    const indexUrl = new URL(root.dataset.index, location.href);
    const siteRoot = new URL("../", indexUrl);
    const $ = (id) => root.querySelector("#" + id);
    const q = $("abp-q"), cat = $("abp-cat"), lang = $("abp-lang"), tier = $("abp-tier"), form = $("abp-form");
    const status = $("abp-status"), out = $("abp-results");
    const initialParams = new URLSearchParams(location.search);
    if (!q.value) q.value = initialParams.get('w') || '';
    selectValue(cat, initialParams.get('category') || '');
    selectValue(tier, initialParams.get('tier') || '');

    let data, service, sequence = 0, identity = '', committedURL = location.href, nodeLimit = 30;
    try {
      service = await window.abpSearch.load();
      data = service.compact;
      if (window.abpI18n?.ready) await window.abpI18n.ready;
    } catch (e) {
      status.textContent = t("errorIndex");
      const retry = document.createElement('button');
      retry.type = 'button'; retry.className = 'abp-btn'; retry.textContent = 'Retry search';
      retry.addEventListener('click', () => { delete root.dataset.ready; retry.remove(); initFinder(); });
      status.after(retry);
      return;
    }
    const langOrder = data.langs.map((l, i) => [l, i]).sort((a, b) => a[0].localeCompare(b[0]));
    lang.insertAdjacentHTML("beforeend", langOrder.map(([l, i]) => `<option value="${i}">${esc(l || "—")}</option>`).join(""));
    const formOrder = [...new Set([...data.forms, ...service.index.forms.map(f => f.name)])].filter(Boolean).sort();
    form.insertAdjacentHTML('beforeend', formOrder.map(f => `<option>${esc(f)}</option>`).join(''));

    const more = $("abp-more");
    let hits = [], shown = 0;

    function row(w, i, reason) {
      const place = data.places[w[5]];
      const href = w[1] === 0 ? YT + encodeURIComponent(w[0]).replace(/%20/g, "+") : w[1];
      const [grp, form] = place[2].split(" › ");
      const favourite = window.abpFavourites?.buttonHTML({
        id: w[6], title: w[0], category: place[3] || String(place[1]), group: grp,
        language: data.langs[w[2]], form: data.forms[w[3]], tier: w[4],
        location: place[0], youtube: href,
      }) || "";
      return (
        `<tr role="row"><td role="cell" class="n">${i + 1}</td>` +
        `<th role="rowheader" scope="row" class="w"><a href="${esc(href)}" target="_blank" rel="noopener" aria-label="${esc(w[0])} — ${esc(t("searchYoutube"))}, ${esc(t("newTab"))}"><span class="abp-play" aria-hidden="true"></span><span class="abp-work-title">${highlight(w[0], q.value)}</span></a>${favourite}<small class="abp-search-reason">${esc(reason)}</small></th>` +
        `<td role="cell" class="lang" data-label="${esc(t("language"))}" data-i18n-label="language">${esc(data.langs[w[2]] || "—")}</td>` +
        `<td role="cell" class="form" data-label="${esc(t("form"))}" data-i18n-label="form">${esc(data.forms[w[3]] || "—")}</td>` +
        `<td role="cell" class="tier" data-label="${esc(t("tier"))}" data-i18n-label="tier"><span class="abp-tier abp-tier--${esc((w[4] || "").toLowerCase())}">${esc(w[4] || "—")}</span></td>` +
        `<td role="cell" class="where" data-label="${esc(t("foundIn"))}" data-i18n-label="foundIn"><a href="${new URL(place[0], siteRoot).href}">${esc(grp)}<span class="abp-sr">, ${esc(form || "")}</span></a>` +
        `<small aria-hidden="true">${place[1]}. ${esc(form || "")}</small></td></tr>`
      );
    }

    function renderMore() {
      const next = hits.slice(shown, shown + BATCH());
      out.insertAdjacentHTML("beforeend", next.map((hit, i) => row(data.works[hit.index], shown + i, hit.reason)).join(""));
      window.abpFavourites?.paintButtons(out);
      if (window.abpI18n) window.abpI18n.translate(out);
      // The existing transliterator intentionally replaces title text. Apply
      // literal highlighting afterwards without changing its original-text map.
      out.querySelectorAll('.abp-work-title').forEach(title => { title.innerHTML = highlight(title.textContent, q.value); });
      shown += next.length;
      more.hidden = shown >= hits.length;
      if (hits.length) status.textContent = `${hits.length.toLocaleString()} ${t("works")} · ${shown.toLocaleString()} ${t("shown")}`;
      more.textContent = `${t("showMore")} (${(hits.length - shown).toLocaleString()})`;
    }

    function searchURL(name, id = '') {
      const url = new URL('find/', siteRoot);
      url.searchParams.set('w', name);
      if (id) url.searchParams.set('identity', id);
      return url.href;
    }
    function group(id, title, rows) {
      $(id).innerHTML = rows.length ? `<h2>${esc(title)}</h2><ul class="abp-search-grid">${rows.join('')}</ul>` : '';
    }
    function selectValue(select, value, label = value) {
      let option = [...select.options].find(o => o.value === value);
      if (!option && value) {
        option = document.createElement('option'); option.value = value;
        option.dataset.unavailable = '1'; select.append(option);
      }
      if (option?.dataset.unavailable) { option.textContent = `Unavailable filter: ${label}`; option.dataset.requested = label; }
      select.value = value;
    }
    function restore() {
      const params = new URLSearchParams(location.search);
      q.value = params.get('w') || '';
      selectValue(cat, params.get('category') || '');
      const language = params.get('language') || '';
      const languageValue = /^\d+$/.test(language) ? language : language ? String(data.langs.indexOf(language)) : '';
      selectValue(lang, languageValue, language);
      selectValue(tier, params.get('tier') || '');
      selectValue(form, params.get('form') || '');
      identity = params.get('identity') || '';
    }
    async function run(historyMode = 'replace') {
      const current = ++sequence;
      const filters = { category: cat.value, language: lang.value, tier: tier.value, form: form.value, identity };
      status.textContent = t('loading');
      let result;
      try { result = await service.search(q.value.trim(), { ...filters, nodeLimit }); }
      catch { if (root.isConnected) status.textContent = t('errorIndex'); return; }
      if (current !== sequence || !root.isConnected) return;
      out.innerHTML = "";
      hits = result.hits;
      shown = 0;
      group('abp-search-identities', 'Deities and Divine Identities', result.identities.map(e =>
        `<li><a href="${esc(searchURL(e.name, e.id))}">${esc(e.name)}</a><small>Matched name: ${esc(e.matched)}${e.corrected ? ' (likely spelling correction)' : ''}</small><small>${esc(e.context)}${e.ambiguous ? ' · Choose an identity to disambiguate' : ''}</small></li>`));
      group('abp-search-hierarchy', 'Categories, Sections and Subsections', result.nodes.map(n =>
        `<li><a href="${esc(new URL(n.url, siteRoot).href)}">${esc(n.name)}</a><small>${esc(n.kind)} · Category ${n.category}</small></li>`));
      if (result.nodeCount > result.nodes.length) {
        const button = document.createElement('button');
        button.type = 'button'; button.className = 'abp-btn';
        button.textContent = `Show more sections (${result.nodeCount - result.nodes.length})`;
        button.addEventListener('click', () => { nodeLimit += 30; run(false); });
        $('abp-search-hierarchy').append(button);
      }
      const related = result.identities.flatMap(e => [...e.parents, ...e.children].map(r => ({ ...r, from: e.name })));
      const relatedIds = new Set();
      group('abp-search-related', 'Related Forms and Traditions', related.filter(r => !relatedIds.has(r.id) && relatedIds.add(r.id)).map(r => {
        const entity = service.index.entities.find(e => e.id === r.id);
        const edgeFrom = service.index.entities.find(e => e.id === r.edgeFrom)?.name || r.from;
        const edgeTo = service.index.entities.find(e => e.id === r.edgeTo)?.name || entity.name;
        const relationship = r.depth > 1 ? `Connected through ${r.depth} documented steps · ${r.from}` : `${edgeFrom} — ${r.type.replaceAll('_', ' ')} — ${edgeTo}`;
        return `<li><a href="${esc(searchURL(entity.name, entity.id))}">${esc(entity.name)}</a><small>${esc(relationship)}</small></li>`;
      }));
      $('abp-suggestions').innerHTML = result.suggestions.map((s, i) => `<button type="button" data-suggestion="${i}">${esc(s.label)}</button>`).join('');
      $('abp-suggestions').querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
        const suggestion = result.suggestions[Number(button.dataset.suggestion)];
        q.value = suggestion.query; identity = suggestion.identity; run('push'); q.focus();
      }));
      if (!q.value.trim() && !Object.values(filters).some(Boolean)) {
        status.textContent = `${data.works.length.toLocaleString()} ${t("works")} · ${t("search")}`;
        more.hidden = true;
        return;
      }
      if (historyMode) {
        const url = new URL(location.href);
        const urlFilters = { ...filters, language: lang.value === '' ? '' : data.langs[Number(lang.value)] ?? lang.selectedOptions[0]?.dataset.requested ?? '' };
        for (const [key, value] of Object.entries({ w: q.value.trim(), ...urlFilters })) {
          value !== '' ? url.searchParams.set(key, value) : url.searchParams.delete(key);
        }
        if (historyMode === 'push' && url.href !== committedURL) {
          history.replaceState({}, '', committedURL);
          history.pushState({}, '', url);
          committedURL = url.href;
        } else if (url.href !== location.href) history.replaceState({}, '', url);
      }
      status.textContent = `${hits.length.toLocaleString()} ${t("works")}`;
      renderMore();
    }

    more.addEventListener("click", renderMore);
    q.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); clearTimeout(timer); run('push'); } });

    let timer;
    const debounced = () => { identity = ''; nodeLimit = 30; clearTimeout(timer); timer = setTimeout(() => run('replace'), 140); };
    q.addEventListener("input", debounced);
    [cat, lang, tier, form].forEach((el) => el.addEventListener("change", () => { clearTimeout(timer); run('push'); }));
    document.addEventListener("abp-languagechange", () => { if (root.isConnected) run(false); });
    window.addEventListener('popstate', () => { if (root.isConnected) { committedURL = location.href; restore(); run(false); } });
    // Preserve text and available filters entered while the lazy index/worker
    // was loading; restoring URL defaults must not erase an early keystroke.
    const draft = { query: q.value, category: cat.value, tier: tier.value };
    restore();
    q.value = draft.query; cat.value = draft.category; tier.value = draft.tier;
    if (draft.query !== (initialParams.get('w') || '')) identity = '';
    run(draft.query !== (initialParams.get('w') || '') ? 'replace' : false);
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) q.focus();
  }

  /* collapse the "jump to form" chips on phones & tablets; keep them open on desktop */
  function initJumpbox() {
    if (!window.matchMedia("(max-width: 60em)").matches) return;
    document.querySelectorAll("details.abp-jumpbox[open]").forEach((d) => d.removeAttribute("open"));
    document.querySelectorAll(".abp-jumpbox .abp-jump a").forEach((a) =>
      a.addEventListener("click", () => a.closest("details").removeAttribute("open"))
    );
  }

  function init() {
    initJumpbox();
    initFinder();
  }

  if (window.document$ && typeof window.document$.subscribe === "function") {
    window.document$.subscribe(init);
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
