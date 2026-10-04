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
const brandName = "Hindu Devotional Collections";
const brandWidths = [320, 360, 375, 390, 412, 768, 1024, 1440];
const shots = process.env.PANCHANG_SCREENSHOTS;
if (shots) await mkdir(shots, { recursive: true });
const mime = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".woff2": "font/woff2", ".webmanifest": "application/manifest+json" };
let legacyWorker = false;
mime[".wasm"] = "application/wasm";
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
  for (const width of brandWidths) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, reducedMotion: "reduce", serviceWorkers: "block" });
    const page = await context.newPage();
    await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
    await page.goto(base);
    assert.equal(await page.title(), brandName, `${width}px: homepage browser title`);
    const cover = page.locator(".abp-cover");
    assert.equal(await cover.locator("a, area, button, [href], [onclick], [tabindex], [usemap]").count(), 0, `${width}px: cover has no links or focusable hotspots`);
    assert.equal(await cover.evaluate((element) => !!element.closest("a, [onclick], [role='link']")), false, `${width}px: cover has no clickable wrapper`);
    assert.ok(await cover.locator("img").evaluate((image) => image.complete && image.naturalWidth > 0), `${width}px: current picture loads`);
    // Sample the entire picture, including both obsolete lower-corner hotspots.
    for (const y of [0.05, 0.5, 0.87, 0.95]) {
      for (const x of [0.05, 0.17, 0.5, 0.83, 0.95]) {
        // Large desktop covers can exceed the viewport: bring this sample into view.
        await cover.evaluate((element, fraction) => {
          const box = element.getBoundingClientRect();
          scrollBy(0, box.top + box.height * fraction - innerHeight / 2);
        }, y);
        const box = await cover.boundingBox();
        const point = { x: box.x + box.width * x, y: box.y + box.height * y };
        assert.ok(await page.evaluate(({ x, y }) => {
          const element = document.elementFromPoint(x, y);
          return !!element?.closest(".abp-cover") && !element.closest("a, button, [role='link']") && getComputedStyle(element).cursor !== "pointer";
        }, point), `${width}px: no clickable overlay or link cursor at ${x},${y}`);
        await page.mouse.click(point.x, point.y);
        assert.equal(page.url(), base, `${width}px: picture click does not navigate`);
      }
    }
    await page.locator("h1.abp-sr").focus();
    await page.keyboard.press("Tab");
    assert.equal(await page.evaluate(() => !!document.activeElement.closest(".abp-cover")), false, `${width}px: Tab skips the non-interactive picture`);
    assert.ok(await page.locator('a[href$="library/"]').count() > 0, "legitimate library navigation remains");
    assert.ok(await page.locator('a[href$="master-index/"]').count() > 0, "legitimate devotional navigation remains");
    assert.equal((await page.locator(".md-header__topic").first().innerText()).trim(), brandName, `${width}px: header brand text`);
    assert.ok(await page.locator(".md-header__title").isVisible(), `${width}px: header brand remains visible`);
    const brandBox = await page.locator(".md-header__title").boundingBox();
    assert.ok(brandBox && brandBox.x >= -1 && brandBox.x + brandBox.width <= width + 1, `${width}px: header brand stays inside the viewport`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px: branding creates no horizontal overflow`);
    assert.equal(await page.locator('meta[property="og:site_name"]').getAttribute("content"), brandName, `${width}px: Open Graph site name`);
    assert.equal(await page.locator('meta[name="twitter:title"]').getAttribute("content"), brandName, `${width}px: social title`);
    const schema = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
    assert.equal(schema.isPartOf.name, brandName, `${width}px: structured-data site name`);
    await page.evaluate(() => scrollTo(0, 400));
    assert.ok(await page.locator(".md-header__topic").first().isVisible(), `${width}px: brand remains visible after scrolling`);
    await page.evaluate(() => scrollTo(0, 0));
    if (width === 320 || width === 1440) {
      await page.goto(base + "find/");
      await page.locator("#abp-q").fill("Hanuman Chalisa");
      await page.waitForFunction(() => document.querySelectorAll("#abp-results tr").length > 0);
      assert.ok(await page.locator("#abp-results").innerText().then((text) => text.includes("Hanuman Chalisa")), "work search remains usable");
      await page.locator("#abp-results .where a").first().click();
      await page.locator("[data-work-id]").first().waitFor();
      assert.ok((await page.title()).endsWith(" | " + brandName), "section navigation keeps title convention");
      for (const route of ["foreword/", "disclaimer/", "library/", "master-index/", "offline/", "tools/indian-ephemeris/"]) {
        await page.goto(base + route, { waitUntil: "domcontentloaded" });
        assert.ok((await page.title()).endsWith(" | " + brandName), route + ": browser title");
      }
      await page.goto(base);
      if (width === 320) {
        await page.locator('.abp-menu-toggle').click();
        assert.equal(await page.locator('.abp-menu-toggle').getAttribute('aria-expanded'), 'true', "mobile navigation opens");
        await page.locator('.abp-menu-close').click();
      }
    }
    if (shots) await page.screenshot({ path: path.join(shots, `branding-home-${width}.png`), fullPage: true });
    console.log(`PASS branding viewport ${width}: non-clickable cover, title, header, metadata, structured data, layout`);
    await context.close();
  }
  if (process.env.BRANDING_ONLY) {
    const context = await browser.newContext({ serviceWorkers: "allow" });
    const page = await context.newPage();
    await page.route("https://fonts.googleapis.com/**", (route) => route.fulfill({ contentType: "text/css", body: "" }));
    await page.goto(base);
    const manifest = await page.evaluate(async () => (await fetch("manifest.webmanifest")).json());
    assert.equal(manifest.name, brandName);
    assert.equal(manifest.short_name, "HDC");
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.waitForFunction(() => navigator.serviceWorker.controller);
    await context.setOffline(true);
    await page.reload();
    assert.equal(await page.title(), brandName, "cached homepage keeps canonical branding offline");
    await page.goto(base + "offline/");
    assert.equal(await page.title(), "You are offline | " + brandName);
    await context.close();
    console.log("PASS PWA manifest, real service worker, cached homepage and offline branding");
    console.log("Branding regression suite passed at all eight requested widths");
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
    process.exit(0);
  }
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
    for (const label of ["Scriptures & Books Library", "Devotional Works"]) {
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

  // One preset is canonical across navigation, reloads, components and tabs.
  const unified = await browser.newContext({ serviceWorkers: "block" });
  const unifiedPage = await unified.newPage();
  const syncErrors = [];
  unifiedPage.on("pageerror", (error) => syncErrors.push(error.message));
  unifiedPage.on("console", (message) => { if (message.type() === "error") syncErrors.push(message.text()); });
  await unifiedPage.clock.setFixedTime(new Date("2026-10-03T06:00:00Z"));
  await unifiedPage.goto(base);
  await ready(unifiedPage);
  assert.equal(await unifiedPage.locator("[data-panchang-location]").inputValue(), "Delhi, India");
  await unifiedPage.locator("details.abp-home-index > summary").filter({ hasText: "TODAY PANCHANG" }).click();
  await unifiedPage.locator("[data-panchang-location]").fill("Mumbai, Maharashtra");
  await unifiedPage.waitForFunction(() => document.querySelector("[data-panchang-field='location']")?.textContent.includes("Mumbai") && document.querySelector("[data-panchang-status]")?.dataset.state === "ready");
  await unifiedPage.goto(base + "hindu-calendar/");
  await ready(unifiedPage);
  assert.equal(await unifiedPage.locator("[data-panchang-location]").inputValue(), "Mumbai, Maharashtra");
  assert.deepEqual(await unifiedPage.evaluate(async () => {
    const settings = await import(new URL("assets/panchang/settings.mjs", location.origin + "/devotional/"));
    const client = await import(new URL("assets/panchang/panchang-client.mjs", location.origin + "/devotional/"));
    const day = await client.calculatePanchangDay("2026-10-03", settings.loadSettings());
    const month = await client.calculatePanchangMonth(2026, 10, settings.loadSettings());
    const sample = month.find((entry) => entry.date === day.date);
    return [sample.moonrise, sample.moonset].map((value) => +new Date(value));
  }), await unifiedPage.evaluate(async () => {
    const settings = await import(new URL("assets/panchang/settings.mjs", location.origin + "/devotional/"));
    const client = await import(new URL("assets/panchang/panchang-client.mjs", location.origin + "/devotional/"));
    const day = await client.calculatePanchangDay("2026-10-03", settings.loadSettings());
    return [day.moonrise, day.moonset].map((value) => +new Date(value));
  }));
  await unifiedPage.goto(base + "tools/indian-ephemeris/");
  const eph = (name) => unifiedPage.locator(`[name='${name}']`);
  await unifiedPage.waitForFunction(() => !document.querySelector("[name=city]")?.disabled);
  await unifiedPage.locator(".eph-advanced > summary").click();
  for (const [name, value] of Object.entries({ city: "Mumbai, Maharashtra", latitude: "19.076", longitude: "72.8777", altitude: "14", timezone: "Asia/Kolkata" })) assert.equal(await eph(name).inputValue(), value);
  await eph("city").fill("Meerut, Uttar Pradesh");
  await eph("city").dispatchEvent("change");
  await unifiedPage.waitForFunction(() => !document.querySelector("[name=city]")?.disabled);
  for (const [name, value] of Object.entries({ city: "Meerut, Uttar Pradesh", latitude: "28.9845", longitude: "77.7064", altitude: "224", timezone: "Asia/Kolkata" })) assert.equal(await eph(name).inputValue(), value);
  await unifiedPage.locator("[data-mode=month]").click();
  assert.equal(await eph("city").inputValue(), "Meerut, Uttar Pradesh");
  await unifiedPage.goto(base + "panchang/?date=2026-10-03");
  await ready(unifiedPage);
  assert.equal(await unifiedPage.locator("[data-panchang-location]").inputValue(), "Meerut, Uttar Pradesh");
  assert.equal(await unifiedPage.locator("[data-panchang-timezone]").inputValue(), "Asia/Kolkata");
  await unifiedPage.goto(base + "hindu-calendar/");
  await ready(unifiedPage);
  await unifiedPage.reload();
  await ready(unifiedPage);
  assert.equal(await unifiedPage.locator("[data-panchang-location]").inputValue(), "Meerut, Uttar Pradesh");
  const secondTab = await unified.newPage();
  secondTab.on("pageerror", (error) => syncErrors.push(error.message));
  secondTab.on("console", (message) => { if (message.type() === "error") syncErrors.push(message.text()); });
  await secondTab.goto(base + "tools/indian-ephemeris/");
  await secondTab.waitForFunction(() => !document.querySelector("[name=city]")?.disabled);
  await unifiedPage.locator("[data-panchang-location]").fill("Mumbai, Maharashtra");
  await secondTab.waitForFunction(() => document.querySelector("[name=city]")?.value === "Mumbai, Maharashtra" && !document.querySelector("[name=city]").disabled);
  assert.equal(await secondTab.locator("[name=latitude]").inputValue(), "19.076");
  await secondTab.goto(base + "tools/indian-ephemeris/?lat=10&lon=20&alt=30&timezone=UTC");
  await secondTab.waitForFunction(() => !document.querySelector("[name=city]")?.disabled);
  await secondTab.locator(".eph-advanced > summary").click();
  assert.equal(await secondTab.locator("[name=latitude]").inputValue(), "10");
  assert.equal(await secondTab.locator("[name=timezone]").inputValue(), "UTC");
  assert.equal(await secondTab.evaluate(() => JSON.parse(localStorage.getItem("abp-panchang-settings-v1")).location.id), "mumbai");
  await secondTab.evaluate(() => {
    navigator.geolocation.getCurrentPosition = (success) => success({ coords: { latitude: 12, longitude: 34, altitude: 56, accuracy: 10 } });
  });
  await secondTab.locator("[data-location]").click();
  assert.equal(await secondTab.locator("[name=city]").inputValue(), "Current location (session only)");
  assert.equal(await secondTab.evaluate(() => JSON.parse(localStorage.getItem("abp-panchang-settings-v1")).location.id), "mumbai");
  await secondTab.evaluate(async () => {
    const settings = await import(new URL("assets/panchang/settings.mjs", location.origin + "/devotional/"));
    settings.saveSettings({ ...settings.loadSettings(), location: settings.findCity("meerut") });
  });
  await secondTab.waitForFunction(() => document.querySelector("[name=city]")?.value === "Meerut, Uttar Pradesh" && !document.querySelector("[name=city]").disabled);
  await unifiedPage.waitForFunction(() => document.querySelector("[data-panchang-location]")?.value === "Meerut, Uttar Pradesh" && document.querySelector("[data-panchang-status]")?.dataset.state === "ready");
  await secondTab.locator("[name=latitude]").fill("11");
  await secondTab.locator("[name=latitude]").dispatchEvent("change");
  assert.equal(await secondTab.evaluate(() => JSON.parse(localStorage.getItem("abp-panchang-settings-v1")).location.id), "meerut");
  await secondTab.locator("[data-mode=month]").click();
  await secondTab.locator("[data-calculate]").click();
  await secondTab.evaluate(async () => {
    const settings = await import(new URL("assets/panchang/settings.mjs", location.origin + "/devotional/"));
    settings.saveSettings({ ...settings.loadSettings(), location: settings.findCity("mumbai") });
  });
  await secondTab.waitForFunction(() => !document.querySelector("[name=city]")?.disabled, null, { timeout: 120000 });
  assert.equal(await secondTab.locator("[name=city]").inputValue(), "Mumbai, Maharashtra");
  assert.equal(await secondTab.locator("[name=latitude]").inputValue(), "19.076");
  await secondTab.locator(".eph-details > summary").click();
  assert.match(await secondTab.locator("[data-details]").innerText(), /19\.076/, await secondTab.locator("[data-status]").innerText());
  assert.deepEqual(syncErrors, []);
  await unified.close();
  console.log("PASS unified city: homepage, daily, monthly, ephemeris, persistence, cross-tab and manual/share privacy");

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
  console.log(`Browser regression suite passed: ${brandWidths.length} branding widths, ${passed} Panchang viewport groups, initialization failure, denied location, themes and real PWA migration/offline calculation`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
