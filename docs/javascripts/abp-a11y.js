/* ABP Devotional — accessibility preferences ("Aa" button in the header)
 *
 *  Text size (4 steps) · High contrast · Readable spacing · Underline links · Stop animations
 *  Saved on this device (localStorage) and applied before first paint by an inline script in main.html.
 *  Also fixes a few unlabeled widgets that Material for MkDocs renders.
 */
(function () {
  "use strict";
  const KEY = "abp-a11y";
  const root = document.documentElement;

  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } };
  const save = (p) => { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch (e) {} };

  function apply(p) {
    root.classList.remove("abp-text-1", "abp-text-2", "abp-text-3");
    if (p.text) root.classList.add("abp-text-" + p.text);
    root.classList.toggle("abp-cards", (p.text || 0) >= 2);
    root.classList.toggle("abp-hc", !!p.contrast);
    root.classList.toggle("abp-spacing", !!p.spacing);
    root.classList.toggle("abp-underline", !!p.underline);
    root.classList.toggle("abp-still", !!p.motion);
    root.classList.toggle("abp-noshortcuts", !!p.noshortcuts);
  }

  const SIZES = [["0", "A", "Normal text"], ["1", "A+", "Large text"], ["2", "A++", "Larger text"], ["3", "A+++", "Largest text"]];
  const TOGGLES = [
    ["contrast", "High contrast", "Black and white, stronger borders"],
    ["spacing", "Readable spacing", "More space between letters, words and lines"],
    ["underline", "Underline links", "Makes every link easy to spot"],
    ["motion", "Stop animations", "No sliding or fading effects"],
    ["noshortcuts", "Turn off single-key shortcuts", "Stops keys like S, N and P from searching or changing page (helps voice control)"],
  ];

  function openPanel() {
    const p = load();
    const dlg = document.createElement("dialog");
    dlg.className = "abp-a11y-dialog";
    dlg.setAttribute("aria-labelledby", "abp-a11y-title");
    dlg.innerHTML =
      '<h2 id="abp-a11y-title">Reading &amp; accessibility</h2>' +
      '<fieldset><legend>Text size</legend><div class="abp-a11y-sizes">' +
      SIZES.map(([v, label, name], i) =>
        `<label><input type="radio" name="abp-size" value="${v}" aria-label="${name}"${String(p.text || 0) === v ? " checked" : ""}>` +
        `<span aria-hidden="true" style="font-size:${0.8 + i * 0.14}rem">${label}</span></label>`).join("") +
      "</div></fieldset>" +
      '<fieldset><legend class="abp-sr">Display options</legend>' +
      TOGGLES.map(([k, label, hint]) =>
        `<label class="abp-a11y-toggle"><span>${label}<small>${hint}</small></span>` +
        `<input type="checkbox" role="switch" name="${k}"${p[k] ? " checked" : ""}></label>`).join("") +
      "</fieldset>" +
      '<div class="abp-a11y-actions"><button type="button" class="abp-btn abp-btn--big" data-reset>Reset</button>' +
      '<button type="button" class="abp-btn abp-btn--big abp-btn--primary" data-close>Done</button></div>';

    const update = () => {
      const next = { text: +dlg.querySelector('input[name="abp-size"]:checked').value };
      TOGGLES.forEach(([k]) => { if (dlg.querySelector(`input[name="${k}"]`).checked) next[k] = true; });
      if (!next.text) delete next.text;
      save(next);
      apply(next);
    };
    dlg.addEventListener("change", update);
    dlg.querySelector("[data-reset]").addEventListener("click", () => {
      dlg.querySelector('input[name="abp-size"][value="0"]').checked = true;
      dlg.querySelectorAll('input[type="checkbox"]').forEach((c) => (c.checked = false));
      update();
    });
    dlg.querySelector("[data-close]").addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    const opener = document.activeElement;
    dlg.addEventListener("close", () => { dlg.remove(); if (opener && opener.focus) opener.focus(); });
    document.body.appendChild(dlg);
    dlg.showModal ? dlg.showModal() : dlg.setAttribute("open", "");
    const first = dlg.querySelector('input[name="abp-size"]:checked');
    first && first.focus();
  }

  function addButton() {
    const inner = document.querySelector(".md-header__inner");
    if (!inner || inner.querySelector(".abp-a11y-btn")) return;
    const b = document.createElement("button");
    b.type = "button";
    b.className = "abp-a11y-btn md-header__button";
    b.title = "Text size & accessibility";
    b.setAttribute("aria-label", "Text size and accessibility settings");
    b.setAttribute("aria-haspopup", "dialog");
    b.innerHTML = '<span aria-hidden="true">A<small>a</small></span>';
    b.addEventListener("click", openPanel);
    const anchor = inner.querySelector(".md-header__option") || inner.querySelector(".md-search") || null;
    inner.insertBefore(b, anchor);
    apply(load());
  }

  /* WCAG 2.1.4: Material binds single-character keys (s, f, /, n, p, ",", ".") — let people switch them off */
  document.addEventListener("keydown", (e) => {
    if (!root.classList.contains("abp-noshortcuts")) return;
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.stopImmediatePropagation();
  }, true);

  /* 2.4.11: Material keeps its dark search overlay open after focus leaves the search box,
     covering whatever the keyboard user tabs to next — close it when focus moves away */
  document.addEventListener("focusin", (e) => {
    const toggle = document.getElementById("__search");
    const search = document.querySelector(".md-search");
    if (toggle && toggle.checked && search && !search.contains(e.target)) {
      toggle.checked = false;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });

  /* 2.4.1: make sure every page has a working "Skip to content" link */
  function ensureSkipLink() {
    const page = document.querySelector(".abp-page");
    if (!page) return;
    if (!page.id) page.id = "abp-main";
    let skip = document.querySelector(".md-skip");
    if (!skip) {
      skip = document.createElement("a");
      skip.className = "md-skip";
      skip.textContent = "Skip to content";
      document.body.insertBefore(skip, document.body.firstChild);
    }
    skip.setAttribute("href", "#abp-main");
    page.setAttribute("tabindex", "-1");
  }

  /* label widgets Material leaves unnamed; hide the decorative loading bar from assistive tech */
  function fixMaterial() {
    const search = document.querySelector(".md-search");
    if (search && !search.getAttribute("aria-label")) search.setAttribute("aria-label", "Search");
    document.querySelectorAll(".md-logo img, .md-header__button.md-logo img").forEach((i) => i.setAttribute("alt", ""));
    const drawer = document.querySelector('label.md-header__button[for="__drawer"]');
    if (drawer && !drawer.querySelector(".abp-sr")) drawer.insertAdjacentHTML("beforeend", '<span class="abp-sr">Menu</span>');
    document.querySelectorAll(".md-progress").forEach((p) => p.setAttribute("aria-hidden", "true"));
    // move focus to the new page's heading after instant navigation, so screen readers announce it
    const h1 = document.querySelector(".md-content h1");
    if (h1 && !h1.hasAttribute("tabindex")) h1.setAttribute("tabindex", "-1");
  }

  /* Card layouts (display:block/grid on table parts) make some browsers, notably Safari/VoiceOver,
     drop table semantics. Explicit ARIA roles keep "row 3 of 12, Language: Hindi" announcements. */
  function enhanceTables() {
    document.querySelectorAll("table.abp-table:not(.abp-table--head):not([data-a11y])").forEach((t) => {
      t.setAttribute("data-a11y", "");
      t.setAttribute("role", "table");
      t.querySelectorAll("thead, tbody").forEach((g) => g.setAttribute("role", "rowgroup"));
      t.querySelectorAll("tr").forEach((r) => r.setAttribute("role", "row"));
      t.querySelectorAll("thead th").forEach((h) => h.setAttribute("role", "columnheader"));
      t.querySelectorAll("tbody th").forEach((h) => h.setAttribute("role", "rowheader"));
      t.querySelectorAll("td").forEach((c) => c.setAttribute("role", "cell"));
      t.querySelectorAll("td.is-empty").forEach((c) => {
        c.innerHTML = '<span aria-hidden="true">—</span><span class="abp-sr">none</span>';
      });
      if (document.getElementById("abp-yt-desc"))
        t.querySelectorAll("tbody th a[target=_blank]").forEach((a) => a.setAttribute("aria-describedby", "abp-yt-desc"));
    });
  }
  window.abpEnhanceTables = enhanceTables;

  let first = true;
  function onPage() {
    addButton();
    ensureSkipLink();
    fixMaterial();
    enhanceTables();
    if (!first) {
      const h1 = document.querySelector(".md-content h1");
      if (h1 && !location.hash) h1.focus({ preventScroll: true });
    }
    first = false;
  }

  if (window.document$ && typeof window.document$.subscribe === "function") window.document$.subscribe(onPage);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", onPage);
  else onPage();
})();
