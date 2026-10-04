/* Browser regression suite: requests are mocked; no real feedback is sent. */
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.join(root, "site");
const shots = process.env.FEEDBACK_SCREENSHOTS;
if (shots) await mkdir(shots, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".webmanifest": "application/manifest+json" };
const server = createServer(async (req, res) => {
  try {
    const relative = decodeURIComponent(new URL(req.url, "http://localhost").pathname).replace(/^\/devotional\/?/, "");
    let file = path.resolve(site, relative);
    if (file !== site && !file.startsWith(site + path.sep)) { res.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const body = await readFile(file);
    res.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch (_) { res.writeHead(404).end(); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/devotional/`;
const browser = await chromium.launch({ headless: true });
let count = 0;
const passed = (name) => { count++; console.log(`PASS ${count}: ${name}`); };
const errors = [];
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: "block", reducedMotion: "reduce" });
const page = await context.newPage();
page.on("pageerror", (error) => errors.push(error.message));
let mode = "success", requests = [], release;
await context.route("**/javascripts/feedback.js", async (route) => {
  const source = await readFile(path.join(root, "docs/javascripts/feedback.js"), "utf8");
  await route.fulfill({ contentType: "text/javascript", body: source.replace(/const FEEDBACK_ENDPOINT = "[^"]*";/, 'const FEEDBACK_ENDPOINT = "https://feedback.test/submit";') });
});
await context.route("https://feedback.test/submit", async (route) => {
  requests.push({ headers: route.request().headers(), body: route.request().postData() });
  if (mode === "hold") await new Promise((resolve) => { release = resolve; });
  if (mode === "network") return route.abort("failed");
  await route.fulfill({ status: mode === "failure" ? 422 : 200, contentType: "application/json", body: mode === "failure" ? '{"errors":[{"message":"<script>bad</script>"}]}' : '{"ok":true}' });
});
const dialog = page.getByRole("dialog", { name: "Help Improve the Hindu Devotional Collection", exact: true });
const floating = page.getByRole("button", { name: "💡 Suggestion / Report Issue", exact: true });
const message = page.getByLabel("Message / Description (required)");
const send = page.getByRole("button", { name: "Send Feedback", exact: true });
const open = async () => { await floating.click(); await dialog.waitFor({ state: "visible" }); };
const close = async () => { await page.getByRole("button", { name: "Close feedback form", exact: true }).click(); await dialog.waitFor({ state: "hidden" }); };
const screenshot = async (name) => { if (shots) await page.screenshot({ path: path.join(shots, name), fullPage: false }); };
try {
  // Baseline screenshots hide only the new script; no production source is altered.
  if (shots) {
    const before = await context.newPage();
    await before.route("**/javascripts/feedback.js", (route) => route.fulfill({ contentType: "text/javascript", body: "" }));
    for (const width of [390, 1440]) { await before.setViewportSize({ width, height: 950 }); await before.goto(base); await before.screenshot({ path: path.join(shots, `home-before-${width}.png`) }); }
    await before.close();
  }
  await page.goto(base);
  await floating.waitFor();
  assert.equal(await floating.count(), 1);
  await screenshot("home-after-1440.png");
  await open();
  assert.equal(await page.getByLabel("Report Type").inputValue(), "Suggestion");
  assert.equal(await page.getByLabel("Reported Link", { exact: true }).isVisible(), false);
  assert.equal(await page.evaluate(() => document.activeElement.id), "abp-feedback-type");
  assert.equal(await page.evaluate(() => getComputedStyle(document.documentElement).overflowY), "hidden");
  assert.equal(await page.getByLabel("Name (optional)").getAttribute("required"), null);
  assert.equal(await page.getByLabel("Email (optional)").getAttribute("required"), null);
  await screenshot("feedback-desktop.png");
  passed("homepage action, labelled modal, Suggestion default, optional identity and scroll lock");
  await send.click(); assert.equal(requests.length, 0);
  await message.fill("  "); await send.click(); assert.equal(requests.length, 0);
  await message.fill("A correction"); await page.getByLabel("Email (optional)").fill("invalid"); await send.click(); assert.equal(requests.length, 0);
  await page.getByLabel("Email (optional)").fill("");
  passed("empty/whitespace message and invalid optional email rejected");
  await message.fill("अ".repeat(3000));
  assert.equal(await message.getAttribute("maxlength"), "3000");
  await message.press("End"); await message.pressSequentially("X"); assert.equal((await message.inputValue()).length, 3000);
  await page.getByRole("button", { name: "Close", exact: true }).focus();
  await page.keyboard.press("Tab"); assert.equal(await page.evaluate(() => document.activeElement.type), "submit");
  await page.keyboard.press("Tab"); assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-label")), "Close feedback form");
  await page.keyboard.press("Escape"); await dialog.waitFor({ state: "hidden" });
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains("abp-feedback-float")), true);
  await open(); await page.mouse.click(1, 1); await dialog.waitFor({ state: "hidden" });
  passed("3,000-character limit, focus trap/return, Escape and outside-click close");

  const index = JSON.parse(await readFile(path.join(site, "assets/works-index.json"), "utf8"));
  const workRoute = index.places[0][0].split("#")[0];
  await page.goto(base + workRoute);
  const reports = page.locator(".abp-feedback-report");
  await reports.first().waitFor();
  const firstLink = page.locator("tr[data-work-id] th.w a").first();
  const exact = await firstLink.getAttribute("href");
  const expectedId = await page.locator("tr[data-work-id]").first().getAttribute("data-work-id");
  await page.locator("tr[data-work-id] .abp-feedback-report").first().click();
  assert.equal(await page.getByLabel("Report Type").inputValue(), "Broken / Dead Link");
  assert.equal(await page.getByLabel("Reported Link", { exact: true }).inputValue(), exact);
  assert.equal(await page.getByLabel("Reported Link", { exact: true }).getAttribute("readonly"), "");
  await message.fill("Automated fixture: the selected link is incorrect.");
  await send.click(); await page.getByText("🙏 Thank you. Your feedback has been received.", { exact: true }).waitFor();
  assert.equal(await page.locator("#abp-feedback-count").innerText(), "0 / 3,000 characters");
  assert.ok(requests.at(-1).body.includes(expectedId));
  for (const key of ["page_url", "page_title", "submitted_at", "anchor_text", "work_title", "category", "section", "cwid"]) assert.ok(requests.at(-1).body.includes(`name="${key}"`), key);
  assert.equal(requests.at(-1).headers.accept, "application/json");
  assert.ok(requests.at(-1).headers["content-type"].startsWith("multipart/form-data"));
  assert.ok(!requests.at(-1).body.includes('name="email"'));
  await close();
  assert.equal(await firstLink.getAttribute("href"), exact);
  assert.equal(await page.locator("nav .abp-feedback-report, .md-header .abp-feedback-report").count(), 0);
  passed("work/CWID/category context, exact read-only URL, successful FormData JSON submission, original link preserved");
  await open(); await message.fill("Another report"); const prior = requests.length; await send.click(); assert.equal(requests.length, prior);
  assert.ok((await page.locator("[data-feedback-status]").innerText()).includes("wait a minute"));
  await close(); await page.evaluate(() => sessionStorage.removeItem("abp-feedback-last-success")); await page.reload();
  passed("successful-submission rate protection");

  await open(); await page.getByLabel("Report Type").selectOption("Broken / Dead Link");
  await page.getByLabel("Reported Link", { exact: true }).fill("javascript:alert(1)"); await message.fill("Link problem"); await send.click(); assert.equal(requests.length, prior);
  await page.getByLabel("Reported Link", { exact: true }).fill("https://example.org/" + "long".repeat(1200));
  assert.equal(await page.evaluate(() => document.querySelector("dialog").scrollWidth <= document.querySelector("dialog").clientWidth + 1), true);
  await close();
  passed("unsafe URLs rejected; long URL contained");

  mode = "failure"; await open(); await message.fill("<img src=x onerror=alert(1)> is my literal report"); await send.click();
  await page.locator("[data-feedback-status].is-error").waitFor();
  assert.ok((await message.inputValue()).startsWith("<img")); assert.equal(await dialog.locator("img").count(), 0); assert.equal(await send.isEnabled(), true);
  mode = "network"; await send.click(); await page.waitForFunction(() => !document.querySelector("dialog form").hasAttribute("aria-busy"));
  assert.equal(await send.isEnabled(), true); await close();
  passed("provider failure/network failure retain text and permit retry; response/input never injected as HTML");

  mode = "hold"; await open(); await message.fill("Duplicate-click test");
  const beforeRequests = requests.length; await send.click();
  await page.waitForFunction(() => document.querySelector("dialog form").getAttribute("aria-busy") === "true");
  await page.evaluate(() => document.querySelector("dialog form").dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
  assert.equal(await send.isEnabled(), false); assert.equal(requests.length, beforeRequests + 1);
  release(); await page.getByText("🙏 Thank you. Your feedback has been received.", { exact: true }).waitFor(); await close();
  passed("duplicate-click/in-flight protection");

  await page.reload(); await page.evaluate(() => sessionStorage.removeItem("abp-feedback-last-success"));
  await open(); await message.fill("Honeypot test"); await page.locator('[name="_gotcha"]').evaluate((node) => { node.value = "bot"; });
  const honey = requests.length; await send.click(); assert.equal(requests.length, honey); await close();
  passed("hidden honeypot blocks submission");

  await page.evaluate(() => {
    const root = document.querySelector(".md-content__inner");
    const fixture = document.createElement("section"); fixture.id = "feedback-fixture";
    fixture.innerHTML = '<h2>Context without CWID</h2><p><a href="https://example.net/test">No identifier</a> <a href="/devotional/">Internal</a> <a href="#x">Anchor</a> <a href="mailto:test@example.net">Mail</a> <a href="tel:123">Phone</a> <a href="javascript:void(0)">Script</a><button>Button</button><a role="button" href="https://example.net/button">Action</a></p><nav><a href="https://example.net/menu">Menu</a></nav>';
    root.appendChild(fixture);
  });
  await page.locator("#feedback-fixture .abp-feedback-report").waitFor();
  assert.equal(await page.locator("#feedback-fixture .abp-feedback-report").count(), 1);
  await page.locator("#feedback-fixture .abp-feedback-report").click(); await message.fill("No CWID fixture"); mode = "success"; await send.click();
  await page.getByText("🙏 Thank you. Your feedback has been received.", { exact: true }).waitFor();
  assert.ok(!requests.at(-1).body.includes('name="cwid"')); assert.ok(requests.at(-1).body.includes("Context without CWID")); await close();
  passed("dynamic links, exclusions and missing-CWID graceful reporting");
  await page.evaluate(() => {
    const root = document.querySelector("#feedback-fixture");
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 2000; i++) { const link = document.createElement("a"); link.href = `https://example.net/large/${i}`; link.textContent = `Work ${i}`; fragment.appendChild(link); }
    root.appendChild(fragment);
  });
  await page.waitForFunction(() => document.querySelectorAll("#feedback-fixture .abp-feedback-report").length === 2001);
  await page.evaluate(() => { const node = document.createElement("p"); node.textContent = "rescan"; document.querySelector("#feedback-fixture").appendChild(node); });
  await page.waitForTimeout(600); assert.equal(await page.locator("#feedback-fixture .abp-feedback-report").count(), 2001);
  passed("2,000-link batch remains shared and duplicate-free on rescan");

  await page.goto(base + "library/");
  await page.locator(".abp-book .abp-feedback-report").first().waitFor();
  assert.equal(await page.locator(".abp-book__btns > .abp-feedback-report").count(), 0);
  assert.ok(await page.locator(".abp-feedback-link-pair > a").count());
  await page.setViewportSize({ width: 390, height: 900 });
  assert.equal(await page.locator(".abp-feedback-link-pair").evaluateAll((nodes) => nodes.every((node) => node.scrollWidth <= node.clientWidth + 1)), true);
  await screenshot("books-phone.png");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator(".abp-book .abp-feedback-report").first().click();
  assert.ok(await page.locator("[data-feedback-context]").innerText()); await close();
  for (const route of ["tools/feedback/", "panchang/", "library/", "tools/feedback/"]) {
    await page.evaluate((href) => { const link = document.createElement("a"); link.id = "feedback-test-nav"; link.href = href; link.textContent = "Test transition"; document.querySelector(".md-content__inner").appendChild(link); }, base + route);
    await page.locator("#feedback-test-nav").click();
    await page.waitForURL(base + route);
    if (route === "tools/feedback/") { await dialog.waitFor({ state: "visible" }); await close(); }
    await floating.waitFor();
    assert.equal(await floating.count(), 1);
  }
  assert.equal(await page.locator(".md-nav a[href$='/tools/feedback/']").count() > 0, true);
  passed("book context, Tools auto-open, repeated Material instant navigation and single floating action");
  await page.goto(base); await open();
  for (const width of [320, 360, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => { const box = document.querySelector("dialog").getBoundingClientRect(); return box.left >= 0 && box.right <= innerWidth && box.height <= innerHeight && document.querySelector("dialog").scrollWidth <= document.querySelector("dialog").clientWidth + 1; }), true, `modal ${width}`);
    if (width === 390) await screenshot("feedback-phone.png");
  }
  await close();
  await page.setViewportSize({ width: 390, height: 900 }); await screenshot("home-after-390.png");
  for (const scheme of ["abp-light", "abp-dark"]) {
    await page.evaluate((value) => document.body.setAttribute("data-md-color-scheme", value), scheme); await open();
    const colours = await page.evaluate(() => { const dialog = document.querySelector("dialog"); return { background: getComputedStyle(dialog).backgroundColor, text: getComputedStyle(dialog).color }; });
    assert.notEqual(colours.background, colours.text);
    if (scheme === "abp-dark") await screenshot("feedback-dark-phone.png");
    await close();
  }
  await page.evaluate(() => document.documentElement.classList.add("abp-hc")); await open(); await screenshot("feedback-high-contrast-phone.png"); await close();
  await page.evaluate(() => document.documentElement.classList.add("abp-text-3", "abp-spacing")); await open();
  assert.equal(await page.evaluate(() => document.querySelector("dialog").scrollWidth <= document.querySelector("dialog").clientWidth + 1), true);
  await close();
  passed("320–1440px modal containment, mobile fields, light/dark/high-contrast themes");
  assert.deepEqual(errors, []); passed("no uncaught browser exceptions");
  console.log(`Feedback browser checks passed: ${count} groups (mocked endpoint, no real submissions)`);
} finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
