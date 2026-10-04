/* Neighbours are generated from publication order, never visitation history. */
(() => {
  function update() {
    document.querySelectorAll('.abp-pager[data-sections]').forEach(pager => {
      const sections = JSON.parse(pager.dataset.sections);
      let anchor = location.hash.slice(1);
      try { anchor = decodeURIComponent(anchor); } catch { /* Keep malformed links harmless. */ }
      let current = sections.find(section => section.anchor === anchor);
      // Work-row links belong to the preceding form heading. These headings
      // are generated from the same ordered dataset, not a separate DOM sort.
      const targetElement = document.getElementById(anchor);
      if (!current && targetElement) {
        for (const section of sections) {
          const heading = document.getElementById(section.anchor);
          if (heading && (heading === targetElement ||
              (heading.compareDocumentPosition(targetElement) & Node.DOCUMENT_POSITION_FOLLOWING))) current = section;
        }
      }
      current ||= sections[0]; // A bare URL starts at the page's first form.
      for (const [selector, key] of [['.abp-pager__p', 'previous'], ['.abp-pager__n', 'next']]) {
        const control = pager.querySelector(selector);
        const target = current[key];
        control.classList.toggle('is-disabled', !target);
        if (target) {
          control.href = pager.dataset.base + target;
          control.removeAttribute('aria-disabled');
          control.removeAttribute('tabindex');
        } else {
          control.removeAttribute('href');
          control.setAttribute('aria-disabled', 'true');
          control.setAttribute('tabindex', '-1');
        }
      }
    });
  }
  window.addEventListener('hashchange', update);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update);
  else update();
  if (typeof document$ !== 'undefined') document$.subscribe(update);
})();
