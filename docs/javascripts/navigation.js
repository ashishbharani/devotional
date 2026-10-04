/* Dependency-free disclosure navigation; Material still owns search and routing. */
(() => {
  function init() {
    const nav = document.querySelector('#abp-navigation');
    if (!nav) return;
    nav.querySelectorAll('a').forEach(link => {
      if (new URL(link.href).pathname === location.pathname) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    nav.querySelectorAll('.abp-navigation__item').forEach(item => {
      const category = location.pathname.includes('/categories/') && item.textContent.includes('DEVOTIONAL WORKS');
      item.classList.toggle('is-active', category || !!item.querySelector('[aria-current="page"]'));
    });
    if (nav.dataset.ready) return;
    nav.dataset.ready = 'true';
    const toggle = document.querySelector('.abp-menu-toggle');
    const shade = document.querySelector('.abp-menu-shade');
    const mobile = matchMedia('(max-width: 1199px)');
    const sections = [...nav.querySelectorAll('.abp-navigation__section')];
    const panel = button => document.getElementById(button.getAttribute('aria-controls'));
    function collapse(except) {
      sections.forEach(button => {
        if (button === except) return;
        button.setAttribute('aria-expanded', 'false');
        panel(button).hidden = true;
      });
    }
    function close(restore = false) {
      collapse();
      nav.classList.remove('is-open');
      document.documentElement.classList.remove('abp-navigation-open');
      toggle.setAttribute('aria-expanded', 'false');
      shade.hidden = true;
      document.querySelectorAll('.md-container, .md-header').forEach(el => { el.inert = false; });
      if (restore) toggle.focus();
    }
    toggle.addEventListener('click', () => {
      if (nav.classList.contains('is-open')) return close(true);
      nav.classList.add('is-open');
      document.documentElement.classList.add('abp-navigation-open');
      toggle.setAttribute('aria-expanded', 'true');
      shade.hidden = false;
      document.querySelectorAll('.md-container, .md-header').forEach(el => { el.inert = true; });
      nav.querySelector('.abp-menu-close').focus();
    });
    nav.querySelector('.abp-menu-close').addEventListener('click', () => close(true));
    shade.addEventListener('click', () => close(true));
    sections.forEach(button => button.addEventListener('click', () => {
      const open = button.getAttribute('aria-expanded') !== 'true';
      collapse(button);
      button.setAttribute('aria-expanded', String(open));
      panel(button).hidden = !open;
    }));
    nav.addEventListener('click', event => {
      if (event.target.closest('a')) close();
    });
    document.addEventListener('click', event => {
      if (!mobile.matches && !nav.contains(event.target)) collapse();
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        if (nav.classList.contains('is-open')) close(true);
        else {
          const open = sections.find(button => button.getAttribute('aria-expanded') === 'true');
          if (open) { collapse(); open.focus(); }
        }
      }
      if (event.key === 'Tab' && nav.classList.contains('is-open')) {
        const controls = [...nav.querySelectorAll('a,button')].filter(el => el.getClientRects().length);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    nav.addEventListener('focusout', event => {
      if (!mobile.matches && !nav.contains(event.relatedTarget)) collapse();
    });
    mobile.addEventListener('change', () => close());
    window.addEventListener('popstate', () => close());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  if (typeof document$ !== 'undefined') document$.subscribe(init);
})();
