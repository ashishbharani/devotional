/* Dependency-free disclosure navigation; Material still owns search and routing. */
(() => {
  let controlsObserver, watchedHeader, bottomObserver, watchedBottom, shellObserver, watchedShell;
  const compactQuery = '(max-width: 1199px), (max-height: 700px) and (any-pointer: coarse)';
  function arrangeControls() {
    const header = document.querySelector('.md-header__inner');
    const slot = document.querySelector('.hdc-mobile-utilities');
    if (!header || !slot) return;
    const move = () => {
      const controls = ['.abp-account','.abp-language-btn'].map(selector => document.querySelector(selector)).filter(Boolean);
      if (matchMedia(compactQuery).matches) {
        controls.filter(node => node.parentElement !== slot).forEach(node => slot.appendChild(node));
      } else {
        const anchor = header.querySelector('[data-install-app]') || header.querySelector('.md-search');
        if (controls.some((node, i) => node.parentElement !== header || node.nextElementSibling !== (controls[i + 1] || anchor))) {
          controls.forEach(node => header.insertBefore(node, anchor));
        }
      }
    };
    move();
    const shell = document.querySelector('.abp-navigation-shell');
    if (shell && shell !== watchedShell && typeof ResizeObserver !== 'undefined') {
      shellObserver?.disconnect();
      shellObserver = new ResizeObserver(() => document.documentElement.style.setProperty('--hdc-header-space', `${Math.ceil(shell.getBoundingClientRect().height)}px`));
      shellObserver.observe(shell);
      watchedShell = shell;
    }
    if (watchedHeader !== header) {
      controlsObserver?.disconnect();
      controlsObserver = new MutationObserver(move);
      controlsObserver.observe(header, {childList:true});
      controlsObserver.observe(slot, {childList:true});
      watchedHeader = header;
    }
    const bottom = document.querySelector('.hdc-bottom-navigation');
    if (bottom && bottom !== watchedBottom && typeof ResizeObserver !== 'undefined') {
      bottomObserver?.disconnect();
      bottomObserver = new ResizeObserver(() => document.documentElement.style.setProperty('--hdc-bottom-space', `${Math.ceil(bottom.getBoundingClientRect().height)}px`));
      bottomObserver.observe(bottom);
      watchedBottom = bottom;
    }
  }
  matchMedia(compactQuery).addEventListener('change', arrangeControls);
  function init() {
    const nav = document.querySelector('#abp-navigation');
    if (!nav) return;
    nav.querySelectorAll('a').forEach(link => {
      if (new URL(link.href).pathname === location.pathname) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    nav.querySelectorAll('.abp-navigation__item').forEach(item => {
      const category = location.pathname.includes('/categories/') && [...item.querySelectorAll('a[href]')].some(link => new URL(link.href).pathname.endsWith('/master-index/'));
      item.classList.toggle('is-active', category || !!item.querySelector('[aria-current="page"]'));
    });
    const items = [...nav.querySelectorAll('.abp-navigation__item')];
    document.querySelectorAll('.hdc-bottom-navigation [data-nav-section]').forEach(control => {
      const active = items[Number(control.dataset.navSection) - 1]?.classList.contains('is-active');
      control.classList.toggle('is-active', !!active);
      if (control.tagName === 'A') {
        if (active) control.setAttribute('aria-current', new URL(control.href).pathname === location.pathname ? 'page' : 'location');
        else control.removeAttribute('aria-current');
      }
    });
    arrangeControls();
    if (nav.dataset.ready) return;
    nav.dataset.ready = 'true';
    const toggle = document.querySelector('.abp-menu-toggle');
    const shade = document.querySelector('.abp-menu-shade');
    const mobile = matchMedia(compactQuery);
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
      document.querySelectorAll('.md-container, .md-header, .hdc-bottom-navigation').forEach(el => { el.inert = false; });
      document.querySelectorAll('[data-open-section]').forEach(button => button.setAttribute('aria-expanded','false'));
      if (restore) toggle.focus();
    }
    function open(sectionId) {
      nav.classList.add('is-open');
      document.documentElement.classList.add('abp-navigation-open');
      toggle.setAttribute('aria-expanded', 'true');
      shade.hidden = false;
      document.querySelectorAll('.md-container, .md-header, .hdc-bottom-navigation').forEach(el => { el.inert = true; });
      const section = sections.find(button => button.getAttribute('aria-controls') === sectionId);
      if (section) { collapse(); section.setAttribute('aria-expanded','true'); panel(section).hidden = false; section.focus(); }
      else nav.querySelector('.abp-menu-close').focus();
    }
    toggle.addEventListener('click', () => nav.classList.contains('is-open') ? close(true) : open());
    document.querySelectorAll('[data-open-section]').forEach(button => button.addEventListener('click', () => { open(button.dataset.openSection); button.setAttribute('aria-expanded','true'); }));
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
      if (document.querySelector('dialog[open]')) return;
      if (event.key === 'Escape') {
        if (nav.classList.contains('is-open')) close(true);
        else {
          const open = sections.find(button => button.getAttribute('aria-expanded') === 'true');
          if (open) { collapse(); open.focus(); }
        }
      }
      if (event.key === 'Tab' && nav.classList.contains('is-open') && !document.querySelector('dialog[open]')) {
        const controls = [...nav.querySelectorAll('a,button')].filter(el => el.getClientRects().length && !el.disabled);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    nav.addEventListener('focusout', event => {
      if (!mobile.matches && !nav.contains(event.relatedTarget)) collapse();
    });
    mobile.addEventListener('change', () => close());
    // A tablet multi-window transition need not cross a width breakpoint.
    // Close an open drawer and reflow controls after the usable viewport changes.
    let previousSize = `${window.innerWidth}x${window.innerHeight}`;
    const onViewportResize = () => {
      const size = `${window.innerWidth}x${window.innerHeight}`;
      if (size === previousSize) return;
      previousSize = size;
      if (nav.classList.contains('is-open')) close();
      arrangeControls();
    };
    window.addEventListener('resize', onViewportResize);
    window.visualViewport?.addEventListener('resize', onViewportResize);
    window.addEventListener('popstate', () => close());
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  if (typeof document$ !== 'undefined') document$.subscribe(init);
})();
