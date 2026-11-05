/* Separate, opt-in reviewed translations for locally hosted Reader books.
 * Never changes the source scripture or claims that missing passages are translated.
 */
(() => {
  'use strict';
  // English is also a translation of Sanskrit/Awadhi, not the original text.
  const codes = new Set(['en','hi','mr','gu','bn','pa','te','kn','ml','ta']);
  const script = document.querySelector('script[src*="javascripts/reader-translations.js"]');
  if (!script) return;
  const rootUrl = new URL('../', script.src);
  const indexUrl = new URL('assets/reader-translations/index.json', rootUrl);
  const fallback = {
    readerOriginal: 'Original text is preserved. Select a language to see reviewed passage translations.',
    readerLoading: 'Checking for reviewed translations…',
    readerMissing: 'No reviewed translations are available for this book in the selected language. The original remains visible.',
    readerShown: 'Showing reviewed translations; other passages remain in their original language.',
    readerPageMissing: 'No reviewed translations are available on this page. The original remains visible.',
    readerError: 'Reviewed translations could not be verified. The original remains visible.',
    readerTranslationTitle: 'Reviewed translation',
  };
  const t = key => {
    const value = window.abpI18n?.t(key);
    return value && value !== key ? value : fallback[key];
  };
  const cache = new Map();
  let indexPromise;
  let requestToken = 0;
  const readIndex = () => {
    if (!indexPromise) {
      indexPromise = fetch(indexUrl.href).then(response => {
        if (!response.ok) throw new Error('Reader translation index unavailable');
        return response.json();
      }).then(value => {
        if (value.schema !== 1 || !value.books || typeof value.books !== 'object') {
          throw new Error('Invalid Reader translation index');
        }
        return value.books;
      }).catch(error => {
        indexPromise = null; // permit a retry after connectivity is restored
        throw error;
      });
    }
    return indexPromise;
  };
  const translation = (path, book, language, sourceSha256) => {
    const key = book + '/' + language;
    if (!cache.has(key)) {
      const expected = 'assets/reader-translations/' + key + '.json';
      if (path !== expected) return Promise.reject(new Error('Untrusted Reader pack path'));
      const url = new URL(path, rootUrl);
      if (url.origin !== rootUrl.origin || !url.pathname.startsWith(rootUrl.pathname + 'assets/reader-translations/')) {
        return Promise.reject(new Error('Invalid local Reader translation URL'));
      }
      cache.set(key, fetch(url.href).then(response => {
        if (!response.ok) throw new Error('Reader language pack unavailable');
        return response.json();
      }).then(pack => {
        if (pack.schema !== 1 || pack.status !== 'reviewed'
            || pack.book !== book || pack.language !== language
            || pack.sourceSha256 !== sourceSha256
            || !pack.translations || typeof pack.translations !== 'object'
            || Array.isArray(pack.translations)) {
          throw new Error('Unreviewed or stale Reader translation pack');
        }
        return pack.translations;
      }).catch(error => {
        cache.delete(key);
        throw error;
      }));
    }
    return cache.get(key);
  };

  function clear(root) {
    for (const details of root.querySelectorAll('[data-reader-translation]')) {
      details.hidden = true;
      details.open = false;
      const text = details.querySelector('[data-reader-translation-text]');
      if (text) { text.textContent = ''; text.removeAttribute('lang'); }
    }
  }

  async function render() {
    const token = ++requestToken;
    const root = document.querySelector('[data-reader][data-reader-book]');
    if (!root) return;
    const book = root.dataset.readerBook;
    const code = window.abpI18n?.language || 'en';
    const status = root.querySelector('[data-reader-translation-status]');
    clear(root);
    if (!codes.has(code)) {
      status.textContent = t('readerOriginal');
      return;
    }
    status.textContent = t('readerLoading');
    try {
      const books = await readIndex();
      if (token !== requestToken || !root.isConnected) return;
      const entry = books[book]?.languages?.[code];
      if (!entry) {
        status.textContent = t('readerMissing');
        return;
      }
      const units = await translation(entry.path, book, code, entry.sourceSha256);
      if (token !== requestToken || !root.isConnected) return;
      let shown = 0;
      for (const article of root.querySelectorAll('[data-reader-passage][data-reader-source-sha256]')) {
        const data = units[article.id];
        if (!data || typeof data.text !== 'string' || !data.text.trim()
            || data.sourceSha256 !== article.dataset.readerSourceSha256) continue;
        const details = article.querySelector('[data-reader-translation]');
        const text = details?.querySelector('[data-reader-translation-text]');
        if (!details || !text) continue;
        text.textContent = data.text;
        text.lang = code;
        text.setAttribute('translate', 'no'); // preserve the reviewed wording
        details.querySelector('summary').textContent = t('readerTranslationTitle');
        details.hidden = false;
        details.open = true;
        shown++;
      }
      status.textContent = shown
        ? t('readerShown')
        : t('readerPageMissing');
    } catch (error) {
      if (token !== requestToken || !root.isConnected) return;
      status.textContent = t('readerError');
      console.warn('HDC Reader translations:', error);
    }
  }
  document.addEventListener('abp-languagechange', render);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
  if (window.document$?.subscribe) window.document$.subscribe(render);
})();
