/* One lazily loaded search service for every public entry point. */
(() => {
  'use strict';
  const script = document.currentScript;
  const base = new URL('../', script.src);
  let loading, worker, serial = 0, workerFailed = false;
  const pending = new Map();
  const call = message => new Promise((resolve, reject) => {
    if (workerFailed) { reject(new Error('Search worker unavailable')); return; }
    const id = ++serial;
    pending.set(id, { resolve, reject });
    worker.postMessage({ ...message, id });
  });
  async function load() {
    if (!loading) loading = (async () => {
      const json = async name => {
        const response = await fetch(new URL('assets/' + name, base));
        if (!response.ok) throw new Error('Search index unavailable (' + response.status + ')');
        const text = await response.text();
        return { value: JSON.parse(text), text };
      };
      const [worksAsset, indexAsset] = await Promise.all([json('works-index.json'), json('universal-search.json')]);
      const compact = worksAsset.value, index = indexAsset.value;
      if (!crypto.subtle) throw new Error('Search integrity verification requires HTTPS');
      const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(worksAsset.text));
      const actual = [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, '0')).join('');
      if (actual !== index.compactDigest) throw new Error('Search assets are from different versions; reload and retry');
      let search;
      if (typeof Worker !== 'undefined') {
        try {
          worker = new Worker(new URL('javascripts/search-worker.mjs', base), { type: 'module' });
          workerFailed = false;
          worker.onmessage = ({ data }) => {
            const request = pending.get(data.id);
            if (!request) return;
            pending.delete(data.id);
            data.error ? request.reject(new Error(data.error)) : request.resolve(data.result);
          };
          worker.onerror = () => {
            workerFailed = true;
            for (const request of pending.values()) request.reject(new Error('Search worker could not start'));
            pending.clear();
          };
          await call({ type: 'init', compact, index });
          let fallback;
          search = async (query, filters) => {
            try { return await call({ type: 'search', query, filters }); }
            catch {
              if (!fallback) {
                const { SearchEngine } = await import(new URL('javascripts/search-core.mjs', base));
                fallback = new SearchEngine(compact, index);
              }
              return fallback.search(query, filters);
            }
          };
        } catch { worker?.terminate(); worker = null; }
      }
      if (!search) {
        const { SearchEngine } = await import(new URL('javascripts/search-core.mjs', base));
        const engine = new SearchEngine(compact, index);
        search = async (query, filters) => engine.search(query, filters);
      }
      return { compact, index, search, base };
    })().catch(error => { loading = null; throw error; });
    return loading;
  }
  window.abpSearch = { load, base };
  function initOverlay() {
    const input = document.querySelector('[data-md-component="search-query"]');
    const output = document.querySelector('.md-search__output');
    if (!input || !output || input.dataset.universalReady) return;
    input.dataset.universalReady = '1';
    const region = document.createElement('div');
    region.className = 'abp-universal-overlay';
    region.setAttribute('aria-label', 'Universal devotional search');
    output.prepend(region);
    let timer, sequence = 0;
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const current = ++sequence, query = input.value.trim();
      if (query.length < 2) { region.replaceChildren(); return; }
      timer = setTimeout(async () => {
        try {
          const service = await load(), result = await service.search(query, {});
          if (current !== sequence) return;
          region.replaceChildren();
          const all = document.createElement('a');
          const url = new URL('find/', base); url.searchParams.set('w', query);
          all.href = url.href; all.textContent = 'Universal catalogue search — ' + result.hits.length.toLocaleString() + ' works';
          region.append(all);
          for (const hit of result.hits.slice(0, 5)) {
            const work = service.compact.works[hit.index], place = service.compact.places[work[5]];
            const a = document.createElement('a');
            a.href = new URL(place[0], base).href;
            a.textContent = work[0] + ' — ' + place[2];
            region.append(a);
          }
        } catch { region.textContent = 'Universal search unavailable. Use Find a Work to retry.'; }
      }, 160);
    });
  }
  function init() {
    initOverlay();
    document.querySelectorAll('[data-universal-search-form]').forEach(form => {
      if (form.dataset.ready) return;
      form.dataset.ready = '1';
      form.action = new URL('find/', base).href;
      form.addEventListener('submit', event => {
        event.preventDefault();
        const url = new URL('find/', base);
        const input = form.querySelector('input');
        url.searchParams.set('w', input.value.trim());
        location.assign(url.href);
      });
    });
  }
  if (window.document$?.subscribe) window.document$.subscribe(init);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
