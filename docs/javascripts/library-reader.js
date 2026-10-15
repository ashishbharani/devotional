/* Progressive enhancement: only verified book sources, never YouTube/search.
 * No content proxying, translation copying, storage or third-party request
 * until the visitor explicitly opens a reader. */
(() => {
  "use strict";
  const selector = "a[data-book-reader]";
  const hosts = new Set(["www.valmikiramayan.net", "sanskritdocuments.org"]);
  let dialog = null;
  let opener = null;

  function closeReader() {
    if (!dialog) return;
    dialog.querySelector("iframe").remove(); // stop requests/media immediately
    dialog.remove();
    dialog = null;
    if (opener?.isConnected) opener.focus();
    opener = null;
  }

  function openReader(link) {
    const url = new URL(link.href);
    if (url.protocol !== "https:" || !hosts.has(url.hostname)) return;
    closeReader();
    opener = link;
    const panel = document.createElement("dialog");
    panel.className = "abp-library-reader";
    panel.setAttribute("aria-labelledby", "abp-library-reader-title");
    // Fixed markup only; source URLs and titles are assigned with DOM APIs.
    panel.innerHTML = '<header><h2 id="abp-library-reader-title"></h2><button type="button" class="abp-btn" autofocus>Close reader</button></header>' +
      '<p>External reader — its content and language options are provided by the source website.</p>' +
      '<p><a class="abp-btn" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">Open original website</a></p>' +
      '<p class="abp-library-reader-status" role="status">If the book is blank, unavailable or difficult to use here, choose “Open original website”. This site cannot detect all external loading failures.</p>' +
      '<iframe sandbox="allow-scripts allow-same-origin allow-forms" referrerpolicy="no-referrer"></iframe>';
    panel.querySelector("h2").textContent = link.dataset.bookReader;
    const original = panel.querySelector("a");
    original.href = url.href;
    original.setAttribute("aria-label", `Open original website for ${link.dataset.bookReader} (opens in a new tab)`);
    const frame = panel.querySelector("iframe");
    frame.title = `External book reader: ${link.dataset.bookReader}`;
    frame.src = url.href;
    panel.querySelector("button").addEventListener("click", closeReader);
    panel.addEventListener("cancel", event => { event.preventDefault(); closeReader(); });
    panel.addEventListener("close", closeReader);
    dialog = panel;
    document.body.append(panel);
    panel.showModal();
    return true;
  }

  function init() {
    // MkDocs instant navigation must not leave a reader from the previous page.
    closeReader();
    if (typeof HTMLDialogElement === "undefined" || !HTMLDialogElement.prototype.showModal) return;
    document.querySelectorAll(selector).forEach(link => {
      if (link.dataset.readerReady) return;
      link.dataset.readerReady = "true";
      link.setAttribute("aria-haspopup", "dialog");
      link.setAttribute("aria-label", `${link.dataset.bookReader} (opens in an in-page reader)`);
      link.title = "Read inside this page; Ctrl/Cmd-click opens the original website";
      link.addEventListener("click", event => {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        if (openReader(link)) event.preventDefault();
      });
    });
  }
  if (window.document$?.subscribe) window.document$.subscribe(init);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
