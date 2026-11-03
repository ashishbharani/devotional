/* Read-only enhancement: keep the existing Japa store and counter authoritative. */
(() => {
  'use strict';
  function render() {
    const resume = document.querySelector('[data-daily-resume]');
    const reader = document.querySelector('[data-daily-reader]');
    if (!resume && !reader) return;
    let count = 0;
    try {
      const value = JSON.parse(localStorage.getItem('abp-japa-state-v1') || 'null');
      if (Number.isSafeInteger(value?.count) && value.count > 0) count = value.count;
    } catch (_) { /* missing, malformed or blocked storage: neutral discovery */ }
    if (resume) {
      resume.hidden = count === 0;
      resume.querySelector('[data-daily-count]').textContent = count ? count.toLocaleString() : '';
    }
    if (reader) {
      let saved;
      try { saved = JSON.parse(localStorage.getItem('hdc-reader-v1') || 'null'); } catch (_) {}
      reader.hidden = saved?.bookmark !== true && saved?.read !== true;
    }
  }
  window.addEventListener('storage', event => {
    if (['abp-japa-state-v1', 'hdc-reader-v1', null].includes(event.key)) render();
  });
  window.addEventListener('pageshow', render);
  if (window.document$?.subscribe) window.document$.subscribe(render);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, {once:true});
  else render();
})();
