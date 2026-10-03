import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { readFile, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = path.resolve(process.env.PANCHANG_TEST_SITE || path.join(root, "site"));
const shots = process.env.PANCHANG_SCREENSHOTS;
if (shots) await mkdir(shots, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
let legacyWorker = false;
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, "http://localhost");
    if (legacyWorker && url.pathname === "/devotional/sw.js") {
      response.writeHead(200, { "Content-Type": "text/javascript", "Cache-Control": "no-cache" });
      response.end(`self.addEventListener('install', e => e.waitUntil(caches.open('udhc-shell-test-legacy').then(c => c.put('assets/panchang/panchang-engine.mjs', new Response('obsolete engine'))).then(() => self.skipWaiting()))); self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));`);
      return;
    }
    const relative = decodeURIComponent(url.pathname).replace(/^\/devotional\/?/, "");
    let file = path.resolve(site, relative.replace(/^\//, ""));
    if (file !== site && !file.startsWith(site + path.sep)) { response.writeHead(403).end(); return; }
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    response.writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" });
    response.end(await readFile(file));
  } catch (_) { response.writeHead(404).end("Not found"); }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const base = `http://127.0.0.1:${server.address().port}/devotional/`;
const browser = await chromium.launch({ headless: true, ...(process.env.PANCHANG_BROWSER ? { executablePath: process.env.PANCHANG_BROWSER } : {}) });
let passed = 0;
const checkLayout = async (page, label) => {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${label}: no horizontal page overflow`);
  const failures = await page.locator(".abp-panchang, .abp-panchang-calendar__card").evaluateAll((elements) => elements.filter((element) => element.scrollWidth > element.clientWidth + 2).map((element) => element.className));
  assert.deepEqual(failures, [], `${label}: no card overflow`);
};
const ready = (page) => page.waitForFunction(() => document.querySelector("[data-panchang-status]")?.dataset.state === "ready", null, { timeout: 60000 });
const moonText = async (scope) => Promise.all(["moonrise", "moonset"].map((field) => scope.locator(`[data-panchang-field='${field}']`).innerText()));
if (process.env.PANCHANG_BASELINE) {
  for (const width of [360, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, reducedMotion: "reduce", serviceWorkers: "block" });
    const page = await context.newPage();
    for (const [label, route] of [["home", ""], ["daily", "panchang/?date=2026-10-03"], ["monthly", "hindu-calendar/"]]) {
      await page.goto(base + route);
      await ready(page);
      if (label === "home") await page.locator("details.abp-home-index > summary").filter({ hasText: "TODAY PANCHANG" }).click();
      await page.screenshot({ path: path.join(shots, `${label}-before-${width}.png`), fullPage: true });
    }
    await context.close();
  }
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  process.exit(0);
}
try {
  for (const width of (process.env.PANCHANG_PWA_ONLY ? [] : [320, 360, 390, 768, 1440])) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, timezoneId: "America/New_York", reducedMotion: "reduce", serviceWorkers: "block" });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    await page.clock.setFixedTime(new Date("2026-10-02T20:00:00Z"));
    await page.goto(base);
    await ready(page);
    const summary = page.locator("details.abp-home-index > summary").filter({ hasText: "TODAY PANCHANG" });
    assert.equal(await summary.getAttribute("aria-expanded"), "false");
    assert.equal(await page.locator("details.abp-home-index").count(), 3);
    await summary.press("Enter");
    await page.waitForFunction(() => document.querySelector("details.abp-home-index > summary[aria-expanded='true']"));
    assert.match(await page.locator("[data-panchang-field='date']").innerText(), /3 October 2026/);
    assert.equal(await page.locator("[data-panchang-tithis] li").count(), 3);
    assert.equal(await page.locator("[data-panchang-muhurtas] dt").count(), 4);
    const delhiMoon = await moonText(page);
    assert.deepEqual(delhiMoon, ["11:27 PM", "01:09 PM"]);
    await page.locator("[data-panchang-location]").fill("Mumbai, Maharashtra");
    await page.waitForFunction(() => document.querySelector("[data-panchang-field='location']")?.textContent.includes("Mumbai"));
    await ready(page);
    const mumbaiMoon = await moonText(page);
    assert.match(mumbaiMoon[0], /No Moonrise on this local civil date/);
    assert.notEqual(mumbaiMoon[1], delhiMoon[1]);
    await page.locator("[data-panchang-location]").fill("Delhi, India");
    await page.waitForFunction(() => document.querySelector("[data-panchang-field='location']")?.textContent.includes("Delhi"));
    await ready(page);
    assert.deepEqual(await moonText(page), delhiMoon);
    await checkLayout(page, `home ${width}`);
    if (shots) await page.screenshot({ path: path.join(shots, `home-${width}.png`), fullPage: true });
    await summary.press("Space");
    await page.waitForFunction(() => document.querySelector("details.abp-home-index > summary[aria-expanded='false']"));
    for (const label of ["Scriptures & Books Library", "Religious Music"]) {
      const existing = page.locator("details.abp-home-index > summary").filter({ hasText: label });
      await existing.press("Enter");
      assert.equal(await existing.evaluate((element) => element.parentElement.open), true);
      await existing.press("Enter");
    }
    if (shots) await page.screenshot({ path: path.join(shots, `home-collapsed-${width}.png`), fullPage: true });
    await summary.press("Enter");
    await page.locator(".abp-panchang__cta--full").click();
    await page.waitForURL("**/panchang/**");
    await page.locator("[data-panchang-view='full']").waitFor();
    await ready(page);
    assert.deepEqual(await moonText(page), delhiMoon, "Today and daily share Moon results");
    assert.equal(await page.locator("[data-panchang-tithis] li").count(), 3);
    assert.match(await page.locator("[data-panchang-tithis]").innerText(), /02 Oct 2026/);
    assert.match(await page.locator("[data-panchang-tithis]").innerText(), /04 Oct 2026/);
    assert.match(await page.locator("[data-panchang-tithis]").innerText(), /Kshaya/);
    assert.equal(await page.locator("[data-panchang-muhurtas] dt").count(), 4);
    await checkLayout(page, `daily ${width}`);
    if (shots) await page.screenshot({ path: path.join(shots, `daily-${width}.png`), fullPage: true });
    const location = page.locator("[data-panchang-location]");
    await location.fill("Mumbai, Maharashtra");
    await page.waitForFunction(() => document.querySelector("[data-panchang-field='location']")?.textContent.includes("Mumbai"));
    await ready(page);
    assert.deepEqual(await moonText(page), mumbaiMoon);
    await page.locator("[data-panchang-date]").fill("2026-01-10");
    await page.locator("[data-panchang-date]").dispatchEvent("change");
    await page.waitForFunction(() => document.querySelector("[data-panchang-field='date']")?.textContent.includes("10 January 2026"));
    await ready(page);
    assert.match(await page.locator("[data-panchang-tithis]").innerText(), /Vriddhi/);
    assert.notDeepEqual(await moonText(page), mumbaiMoon, "date change recalculates Moon events");
    await page.goto(`${base}hindu-calendar/`);
    await ready(page);
    assert.equal(await page.locator(".abp-panchang-calendar__card").count(), 31);
    const oct3 = page.locator(".abp-panchang-calendar__card").filter({ has: page.locator("a[href*='date=2026-10-03']") });
    assert.equal(await oct3.locator(".abp-panchang-calendar__transition").count(), 3);
    if (shots) await page.screenshot({ path: path.join(shots, `monthly-compact-${width}.png`), fullPage: true });
    await oct3.locator("summary").click();
    assert.deepEqual(await moonText(oct3), mumbaiMoon, "monthly and daily agree at the selected location");
    assert.equal(await oct3.locator("[data-panchang-muhurtas] dt").count(), 4);
    await checkLayout(page, `monthly ${width}`);
    await page.evaluate(() => window.scrollTo(0, 0));
    if (shots) await page.screenshot({ path: path.join(shots, `monthly-${width}.png`), fullPage: true });
    assert.deepEqual(errors, [], `no console errors at ${width}px`);
    passed += 1;
    console.log(`PASS browser viewport ${width}: Today, keyboard disclosures, daily, location, Vriddhi, monthly, layout, console`);
    await context.close();
  }
  // Engine/module failure must yield an honest message rather than stale data.
  const context = await browser.newContext({ serviceWorkers: "block" });
  const page = await context.newPage();
  await page.route("**/panchang-engine.mjs", (route) => route.abort());
  await page.goto(`${base}panchang/?date=2026-10-03`);
  await page.waitForFunction(() => document.querySelector("[data-panchang-status]")?.dataset.state === "error", null, { timeout: 60000 });
  assert.match(await page.locator("[data-panchang-status]").innerText(), /Please refresh and try again/);
  assert.equal(await page.locator("[data-panchang-tithis] li").count(), 0);
  await context.close();
  console.log("PASS initialization failure is clear and contains no stale tithis");
  // Denied geolocation retains the actual chosen city, never fabricated data.
  const denied = await browser.newContext({ serviceWorkers: "block" });
  const deniedPage = await denied.newPage();
  await deniedPage.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_, failure) => failure({ code: 1 });
  });
  await deniedPage.goto(`${base}panchang/?date=2026-10-03`);
  await ready(deniedPage);
  for (const [date, field] of [["2026-01-10", "moonrise"], ["2026-01-25", "moonset"]]) {
    await deniedPage.locator("[data-panchang-date]").fill(date);
    await deniedPage.locator("[data-panchang-date]").dispatchEvent("change");
    await deniedPage.waitForFunction((value) => document.querySelector("[data-panchang-date]")?.value === value && document.querySelector("[data-panchang-status]")?.dataset.state === "ready", date);
    await deniedPage.locator(`[data-panchang-field='${field}']`).filter({ hasText: /No Moon/ }).waitFor();
    assert.match(await deniedPage.locator(`[data-panchang-field='${field}']`).innerText(), /No Moon.* on this local civil date/);
  }
  await deniedPage.locator("[data-panchang-date]").fill("2026-10-03");
  await deniedPage.locator("[data-panchang-date]").dispatchEvent("change");
  await deniedPage.waitForFunction(() => document.querySelector("[data-panchang-field='date']")?.textContent.includes("3 October 2026"));
  await ready(deniedPage);
  await deniedPage.locator("[data-panchang-geolocate]").click();
  assert.match(await deniedPage.locator("[data-panchang-status]").innerText(), /Continuing with Delhi/);
  assert.equal(await deniedPage.locator("[data-panchang-tithis] li").count(), 3);
  await deniedPage.locator("[data-panchang-timezone]").fill("Asia/Kolkata");
  await deniedPage.locator("[data-panchang-timezone]").dispatchEvent("change");
  await ready(deniedPage);
  for (const scheme of ["abp-dark", "abp-light"]) {
    await deniedPage.evaluate((value) => document.body.dataset.mdColorScheme = value, scheme);
    await checkLayout(deniedPage, `daily theme ${scheme}`);
    if (shots) await deniedPage.screenshot({ path: path.join(shots, `daily-${scheme}.png`), fullPage: true });
  }
  await deniedPage.evaluate(() => document.documentElement.classList.add("abp-hc"));
  await checkLayout(deniedPage, "daily high contrast");
  await denied.close();
  console.log("PASS denied location and light/dark/high-contrast layouts");

  // Simulate an already-installed older deployment, then update the real SW.
  // Its activation must clear obsolete modules and reload in-memory calculations.
  legacyWorker = true;
  const offline = await browser.newContext({ serviceWorkers: "allow" });
  const offlinePage = await offline.newPage();
  offline.on("serviceworker", (worker) => worker.on("console", (message) => console.log("SW", message.text())));
  await offlinePage.goto(`${base}panchang/?date=2026-10-03`);
  await ready(offlinePage);
  await offlinePage.evaluate(() => navigator.serviceWorker.ready);
  await offlinePage.waitForFunction(() => navigator.serviceWorker.controller);
  console.log("PASS legacy service worker controls the page");
  assert.ok(await offlinePage.evaluate(async () => (await caches.keys()).includes("udhc-shell-test-legacy")));
  legacyWorker = false;
  try { await Promise.all([
    offlinePage.waitForEvent("load", { timeout: 45000 }),
    offlinePage.evaluate(async () => (await navigator.serviceWorker.getRegistration()).update()),
  ]); }
  catch (error) {
    console.log("Migration diagnostics", await offlinePage.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return { caches: await caches.keys(), installing: registration?.installing?.state, waiting: registration?.waiting?.state, active: registration?.active?.state, controller: navigator.serviceWorker.controller?.scriptURL };
    }));
    throw error;
  }
  await ready(offlinePage);
  const keys = await offlinePage.evaluate(() => caches.keys());
  assert.ok(!keys.includes("udhc-shell-test-legacy"), "old cache removed");
  assert.ok(keys.some((key) => key.startsWith("udhc-shell-")), "new shell installed");
  await offline.setOffline(true);
  await offlinePage.reload();
  await ready(offlinePage);
  assert.equal(await offlinePage.locator("[data-panchang-tithis] li").count(), 3);
  assert.equal(await offlinePage.locator("[data-panchang-muhurtas] dt").count(), 4);
  assert.deepEqual(await moonText(offlinePage), ["11:27 PM", "01:09 PM"]);
  assert.ok(await offlinePage.evaluate(async () => (await (await fetch("../assets/panchang/panchang-engine.mjs")).text()).includes("export const astronomy")), "offline engine is new, not obsolete");
  await offline.close();
  console.log(`Browser regression suite passed: ${passed} viewport groups, initialization failure, denied location, themes and real PWA migration/offline calculation`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
