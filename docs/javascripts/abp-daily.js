/* Read-only enhancement: keep the existing Japa store and counter authoritative. */
(() => {
  'use strict';
  function render() {
    const resume = document.querySelector('[data-daily-resume]');
    if (!resume) return;
    let count = 0;
    try {
      const value = JSON.parse(localStorage.getItem('abp-japa-state-v1') || 'null');
      if (Number.isSafeInteger(value?.count) && value.count > 0) count = value.count;
    } catch (_) { /* missing, malformed or blocked storage: neutral discovery */ }
    resume.hidden = count === 0;
    resume.querySelector('[data-daily-count]').textContent = count ? count.toLocaleString() : '';
  }
  window.addEventListener('storage', event => {
    if (event.key === 'abp-japa-state-v1' || event.key === null) render();
  });
  window.addEventListener('pageshow', render);
  if (window.document$?.subscribe) window.document$.subscribe(render);
  else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render, {once:true});
  else render();
})();
