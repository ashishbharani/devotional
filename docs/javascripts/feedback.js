/* Shared feedback for the collection. No account credentials belong in this file. */
(() => {
  "use strict";
  // CONFIGURATION: paste your public Formspree / compatible HTTPS form URL here.
  const FEEDBACK_ENDPOINT = "https://formspree.io/f/mjyknzvy";
  const TYPES = ["Suggestion", "Broken / Dead Link", "Incorrect Information", "Missing Work",
    "Duplicate Entry", "Wrong Category / Section", "Spelling / Typographical Error",
    "Book / Scripture Link Problem", "Audio / YouTube Link Problem", "Website Technical Problem", "Other"];
  const LINK_TYPES = new Set([TYPES[1], TYPES[7], TYPES[8]]);
  const RATE_KEY = "abp-feedback-last-success";
  const COOLDOWN = 60000;
  const reporters = new WeakMap();
  const sources = new WeakMap();
  let modal, form, trigger, context = {}, sending = false, sent = false, lastSuccess = 0;
  let observer, observed, queued = false, epoch = 0;
  const clean = (value, limit = 300) => String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
  const text = (node) => clean(node?.textContent);
  function httpURL(value) {
    try {
      const url = new URL(value);
      return /^https?:$/.test(url.protocol) && !url.username && !url.password ? url.href : "";
    } catch (_) { return ""; }
  }
  function endpoint() {
    const url = httpURL(FEEDBACK_ENDPOINT);
    return url.startsWith("https://") ? url : "";
  }
  function field(name) { return form.elements.namedItem(name); }
  function status(message, error = false) {
    const node = modal.querySelector("[data-feedback-status]");
    node.textContent = message;
    node.classList.toggle("is-error", error);
  }
  function headingBefore(anchor, selector = "h2, h3, h4") {
    const root = anchor?.closest(".abp-page, .md-content__inner");
    let heading = "";
    root?.querySelectorAll(selector).forEach((node) => {
      if (node.compareDocumentPosition(anchor) & Node.DOCUMENT_POSITION_FOLLOWING) heading = text(node);
    });
    return heading;
  }
  function attribute(anchor, names) {
    for (const name of names) {
      const parent = anchor?.closest(`[${name}]`);
      if (parent?.getAttribute(name)) return clean(parent.getAttribute(name));
    }
    return "";
  }
  function collect(anchor) {
    // Do not automatically transmit query strings (which may contain account tokens
    // or precise Panchang coordinates). The explicitly reported URL stays exact.
    const page = new URL(location.href);
    page.search = "";
    const row = anchor?.closest("tr, li, [data-work-id], [data-cwid], .abp-result, .abp-card");
    const metadata = row?.querySelector(".abp-favourite[data-work-id]");
    const value = (names) => attribute(anchor, names) || clean(names.map((name) => metadata?.getAttribute(name)).find(Boolean));
    const book = anchor?.closest(".abp-book, .book-card, [data-book-title]");
    const table = anchor?.closest("[data-category], table");
    const workTitle = value(["data-title", "data-work-title"]) || text(row?.querySelector(".abp-work-title, th[scope='row'] a"));
    return {
      page_url: page.href, page_title: clean(document.title),
      reported_url: anchor ? httpURL(anchor.href) : "", anchor_text: text(anchor),
      heading: anchor ? headingBefore(anchor) : text(document.querySelector(".md-content h1")),
      work_title: workTitle, cwid: value(["data-cwid", "data-work-id"]),
      category: value(["data-category"]) || text(document.querySelector(".abp-breadcrumb")),
      section: value(["data-section", "data-group"]) || (anchor ? headingBefore(anchor, "h2") : ""),
      form: clean(table?.getAttribute("data-form")),
      book_title: attribute(anchor, ["data-book-title"]) || text(book?.querySelector("h3, h2")),
    };
  }
  function linkField() {
    const show = !!context.reported_url || LINK_TYPES.has(field("report_type").value);
    modal.querySelector("[data-feedback-link]").hidden = !show;
    field("reported_url").readOnly = !!context.reported_url;
    field("reported_url").required = show;
    field("reported_url").disabled = !show;
  }
  function close() { if (modal.open) modal.close(); }
  function createModal() {
    modal = document.createElement("dialog");
    modal.id = "abp-feedback-dialog";
    modal.className = "abp-feedback-dialog";
    modal.setAttribute("aria-labelledby", "abp-feedback-title");
    modal.setAttribute("aria-describedby", "abp-feedback-intro");
    // Static trusted markup only. Context, visitor input and responses use text/value.
    modal.innerHTML = `<button type="button" class="abp-feedback-close" aria-label="Close feedback form">×</button>
      <h2 id="abp-feedback-title">Help Improve the Hindu Devotional Collection</h2>
      <p id="abp-feedback-intro">Suggestions, corrections and reports help improve and preserve this free devotional collection. Thank you for taking the time to help.</p>
      <form novalidate>
        <label for="abp-feedback-type">Report Type</label><select id="abp-feedback-type" name="report_type"></select>
        <div data-feedback-link hidden><label for="abp-feedback-url">Reported Link</label>
          <input id="abp-feedback-url" name="reported_url" type="url" maxlength="8192" placeholder="https://…">
          <p class="abp-feedback-context" data-feedback-context></p></div>
        <label for="abp-feedback-message">Message / Description (required)</label>
        <textarea id="abp-feedback-message" name="message" required maxlength="3000" rows="5" aria-describedby="abp-feedback-count"></textarea>
        <small id="abp-feedback-count">0 / 3,000 characters</small>
        <div class="abp-feedback-pair"><div><label for="abp-feedback-name">Name (optional)</label>
          <input id="abp-feedback-name" name="name" autocomplete="name" maxlength="100"></div>
          <div><label for="abp-feedback-email">Email (optional)</label>
          <input id="abp-feedback-email" name="email" type="email" autocomplete="email" maxlength="254"></div></div>
        <div class="abp-feedback-trap" hidden aria-hidden="true"><label for="abp-feedback-gotcha">Leave this field empty</label>
          <input id="abp-feedback-gotcha" name="_gotcha" tabindex="-1" autocomplete="off"></div>
        <p class="abp-feedback-privacy">Please do not submit sensitive personal information. Contact details are optional and should be provided only if you would like a response. Feedback and page/link details are sent to the collection’s configured form provider. No browser fingerprint or tracking is collected.</p>
        <p data-feedback-status role="status" aria-live="polite" aria-atomic="true"></p>
        <div class="abp-feedback-actions"><button type="button" data-feedback-close>Close</button>
          <button type="submit">Send Feedback</button></div>
      </form>`;
    form = modal.querySelector("form");
    TYPES.forEach((type) => { const option = document.createElement("option"); option.value = type; option.textContent = type; field("report_type").appendChild(option); });
    modal.querySelectorAll(".abp-feedback-close, [data-feedback-close]").forEach((button) => button.addEventListener("click", close));
    // A click in dialog padding is not an outside click.
    modal.addEventListener("click", (event) => {
      if (event.target !== modal) return;
      const box = modal.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
    });
    modal.addEventListener("close", () => {
      document.documentElement.classList.remove("abp-feedback-open");
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    });
    modal.addEventListener("keydown", (event) => {
      if (event.key !== "Tab") return;
      const targets = [...modal.querySelectorAll("button, input, textarea, select")].filter((node) => !node.disabled && node.getClientRects().length);
      const first = targets[0], last = targets[targets.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    });
    field("report_type").addEventListener("change", linkField);
    field("message").addEventListener("input", () => {
      field("message").setCustomValidity("");
      modal.querySelector("#abp-feedback-count").textContent = `${field("message").value.length} / 3,000 characters`;
    });
    form.addEventListener("submit", submit);
    document.body.appendChild(modal);
  }
  function open(opener, anchor) {
    if (!modal) createModal();
    if (typeof modal.showModal !== "function") {
      // Unsupported old browsers retain the small Tools page rather than an
      // inaccessible imitation of a modal that cannot trap focus.
      alert("Feedback needs a newer browser. Please update your browser and try again.");
      return;
    }
    if (sending) { if (!modal.open) modal.showModal(); document.documentElement.classList.add("abp-feedback-open"); return; }
    trigger = opener;
    context = collect(anchor);
    form.reset();
    sent = false;
    field("message").setCustomValidity("");
    field("report_type").value = anchor ? TYPES[1] : TYPES[0];
    field("reported_url").value = context.reported_url;
    modal.querySelector("[data-feedback-context]").textContent = [context.work_title || context.book_title, context.cwid, context.anchor_text].filter(Boolean).join(" · ");
    modal.querySelector("#abp-feedback-count").textContent = "0 / 3,000 characters";
    linkField();
    form.querySelector('[type="submit"]').disabled = !endpoint();
    status(endpoint() ? "" : "Feedback sending is not yet enabled. The site owner needs to connect the receiving form. Your message has not been sent.");
    if (!modal.open) modal.showModal();
    document.documentElement.classList.add("abp-feedback-open");
    field("report_type").focus();
  }
  async function submit(event) {
    event.preventDefault();
    if (sending || sent) return;
    if (field("_gotcha").value) { status("Unable to send this submission. Please reopen the form and try again.", true); return; }
    const message = field("message").value.trim();
    field("message").setCustomValidity(!message ? "Please describe your suggestion or issue." : message.length > 3000 ? "Please use no more than 3,000 characters." : "");
    if (!TYPES.includes(field("report_type").value)) { status("Please select a valid report type.", true); return; }
    if (!form.reportValidity()) return;
    const url = field("reported_url").disabled ? "" : httpURL(field("reported_url").value);
    if (!field("reported_url").disabled && !url) { status("Please enter a valid HTTP or HTTPS link without embedded credentials.", true); field("reported_url").focus(); return; }
    if (!endpoint()) { status("Feedback sending is not yet enabled. Your message has not been sent.", true); return; }
    try { lastSuccess = Math.max(lastSuccess, Number(sessionStorage.getItem(RATE_KEY)) || 0); } catch (_) {}
    if (Date.now() - lastSuccess < COOLDOWN) { status("Please wait a minute before sending another report.", true); return; }
    const data = new FormData(form);
    data.set("message", message);
    if (!field("email").value.trim()) data.delete("email");
    for (const [key, value] of Object.entries(context)) if (value) data.set(key, value);
    if (url) data.set("reported_url", url); else data.delete("reported_url");
    data.set("submitted_at", new Date().toISOString());
    data.set("_subject", `Devotional Collection: ${field("report_type").value}`);
    sending = true;
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    form.setAttribute("aria-busy", "true");
    // Freeze the snapshot while sending, but keep Close available.
    const controls = [...form.querySelectorAll("input, select, textarea")];
    const disabled = controls.map((control) => control.disabled);
    controls.forEach((control) => { control.disabled = true; });
    status("Sending your feedback…");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch(endpoint(), { method: "POST", body: data, headers: { Accept: "application/json" }, signal: controller.signal, credentials: "omit", redirect: "error", referrerPolicy: "no-referrer" });
      if (!response.ok) throw new Error("provider");
      // Formspree confirms with JSON; an HTML login/challenge is not success.
      const receipt = await response.json();
      if (!receipt || typeof receipt !== "object" || receipt.errors || receipt.error || receipt.ok === false) throw new Error("provider");
      lastSuccess = Date.now();
      try { sessionStorage.setItem(RATE_KEY, String(lastSuccess)); } catch (_) {}
      sent = true;
      status("🙏 Thank you. Your feedback has been received.");
      field("message").value = ""; field("name").value = ""; field("email").value = "";
      modal.querySelector("#abp-feedback-count").textContent = "0 / 3,000 characters";
    } catch (_) {
      status("We could not confirm receipt. Your message is still here. Please check your connection and try again later; if you already received confirmation, do not resend.", true);
    } finally {
      clearTimeout(timer);
      sending = false;
      controls.forEach((control, index) => { control.disabled = disabled[index]; });
      button.disabled = sent || !endpoint();
      form.removeAttribute("aria-busy");
    }
  }
  function qualifies(anchor) {
    if (!anchor.matches("a[href]") || anchor.closest("nav, form, .md-nav, .md-header, .md-footer, .abp-parts, .abp-pager, .abp-feedback-dialog, [data-no-feedback], [role='button'], button")) return false;
    if (anchor.classList.contains("abp-btn") && !anchor.closest(".abp-book")) return false;
    const raw = anchor.getAttribute("href")?.trim() || "";
    if (!/^https?:\/\//i.test(raw) || !text(anchor)) return false;
    const url = httpURL(anchor.href);
    return !!url && new URL(url).origin !== location.origin;
  }
  function scan(node) {
    if (!node?.querySelectorAll) return;
    const anchors = node.matches?.("a[href]") ? [node] : [...node.querySelectorAll("a[href]")];
    for (const anchor of anchors) {
      if (!qualifies(anchor) || reporters.get(anchor)?.isConnected) continue;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "abp-feedback-report";
      button.title = "Report this link as broken or incorrect";
      button.setAttribute("aria-label", `Report this link as broken or incorrect: ${text(anchor)}`);
      button.setAttribute("aria-haspopup", "dialog");
      button.textContent = "⚠";
      reporters.set(anchor, button); sources.set(button, anchor);
      if (anchor.parentElement.matches(".abp-book__btns")) {
        const pair = document.createElement("span");
        pair.className = "abp-feedback-link-pair";
        anchor.before(pair); pair.append(anchor, button);
      } else anchor.after(button);
    }
  }
  function queueScan() {
    if (queued) return;
    queued = true;
    const current = epoch;
    const run = () => { queued = false; if (current === epoch && observed?.isConnected) scan(observed); };
    if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 500 }); else setTimeout(run, 50);
  }
  function floatingPosition() {
    const button = document.querySelector(".abp-feedback-float");
    const note = document.querySelector(".abp-ios-install");
    if (button) button.style.bottom = note ? `${Math.max(16, innerHeight - note.getBoundingClientRect().top + 12)}px` : "";
  }
  function init() {
    if (!document.body) return;
    if (!document.querySelector(".abp-feedback-float")) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "abp-feedback-float";
      button.textContent = "💡 Suggestion / Report Issue";
      button.setAttribute("aria-haspopup", "dialog");
      button.setAttribute("aria-controls", "abp-feedback-dialog");
      document.body.appendChild(button);
    }
    const root = document.querySelector(".md-content__inner, .md-content");
    if (observed !== root) {
      observer?.disconnect(); epoch++; queued = false; observed = root;
      if (modal?.open && !sending) close();
      if (root) {
        scan(root);
        observer = new MutationObserver((records) => {
          if (records.some((record) => [...record.addedNodes].some((node) => node.nodeType === 1 && !node.matches(".abp-feedback-report")))) queueScan();
        });
        observer.observe(root, { childList: true, subtree: true });
      }
    } else if (root) scan(root);
    floatingPosition();
    const action = root?.querySelector("[data-feedback-open]");
    if (action && !action.dataset.feedbackInvoked) { action.dataset.feedbackInvoked = "true"; open(action); }
  }
  document.addEventListener("click", (event) => {
    const button = event.target.closest?.(".abp-feedback-float, .abp-feedback-report, [data-feedback-open]");
    if (!button) return;
    const anchor = sources.get(button);
    if (anchor && !qualifies(anchor)) return;
    event.preventDefault(); open(button, anchor);
  });
  // The install-help banner can appear independently of page navigation.
  const bodyObserver = new MutationObserver(floatingPosition);
  function start() { init(); bodyObserver.observe(document.body, { childList: true }); }
  window.addEventListener("resize", floatingPosition, { passive: true });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
  if (window.document$?.subscribe) window.document$.subscribe(init);
})();
