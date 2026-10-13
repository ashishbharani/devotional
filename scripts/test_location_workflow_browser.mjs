import assert from "node:assert/strict";

export async function testLocationWorkflow(browser, base) {
  for (const width of [320, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 950 }, serviceWorkers: "block", reducedMotion: "reduce",
      permissions: ["geolocation"], geolocation: { latitude: 28.9845, longitude: 77.7064, accuracy: 20 } });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let requests = 0;
    await page.route("https://nominatim.openstreetmap.org/**", async (route) => {
      requests++;
      const query = new URL(route.request().url()).searchParams;
      assert.equal(query.get("countrycodes"), "in");
      assert.equal(query.get("limit"), "6");
      if (query.get("q") === "Unavailable") return route.fulfill({ status: 429, body: "Busy" });
      await route.fulfill({ contentType: "application/json", body: JSON.stringify([
        { osm_id: 1, osm_type: "relation", display_name: "Vrindavan, Mathura, Uttar Pradesh, India", lat: "27.58", lon: "77.7", address: { country_code: "in" } },
        { osm_id: 2, osm_type: "node", display_name: "Vrindavan, another district, India", lat: "26", lon: "78", address: { country_code: "in" } },
        { osm_id: 3, display_name: "Outside India", lat: "10", lon: "20", address: { country_code: "us" } },
      ]) });
    });
    await page.goto(base + "panchang/?date=2026-10-03");
    const ready = () => page.waitForFunction(() => document.querySelector("[data-panchang-status]")?.dataset.state === "ready");
    await ready();
    const input = page.locator("[data-panchang-location]");
    await input.fill("No");
    await input.press("Enter");
    assert.match(await page.locator("[data-location-message]").innerText(), /at least 3/);
    assert.equal(requests, 0, "short queries never call the provider");
    await input.fill("Vrindavan");
    await page.waitForTimeout(800);
    assert.equal(requests, 0, "typing never calls the provider");
    await input.press("Enter");
    await page.locator("[data-location-results] button").first().waitFor();
    assert.equal(await page.locator("[data-location-results] button").count(), 2, "ambiguous Indian matches shown, foreign results rejected");
    assert.equal(await page.evaluate(async () => (await import('/devotional/assets/panchang/settings.mjs')).loadSettings().location.id), "delhi", "search does not silently select");
    await page.locator("[data-location-results] button").first().click();
    await ready();
    assert.match(await page.locator("[data-location-message]").innerText(), /Elevation unknown/);
    await input.fill("Cancelled search");
    await page.locator("[data-location-search]").click();
    await input.fill("Vrindavan, Mathura, Uttar Pradesh, India");
    await page.waitForTimeout(900);
    assert.equal(requests, 1, "editing aborts delayed stale searches before network access");
    assert.equal(await page.locator("[data-location-results] button").count(), 0);
    assert.match(await page.locator("[data-panchang-field=location]").innerText(), /Vrindavan/);
    const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("abp-panchang-settings-v1")));
    assert.equal(saved.location.altitudeKnown, false);
    assert.equal(saved.location.altitude, 0);
    assert.equal(saved.location.timezoneOffset, 330);
    await input.fill("Vrindavan");
    await page.locator("[data-location-search]").click();
    await page.locator("[data-location-results] button").first().waitFor();
    assert.equal(requests, 1, "successful searches are session cached");
    await page.locator("[data-location-results] button").first().click();
    await ready();
    // Render a second live consumer, without navigation, to test same-document
    // sharing of device/manual coordinates that must never enter localStorage.
    await page.evaluate(async () => {
      const style = document.createElement("link"); style.rel = "stylesheet"; style.href = "/devotional/stylesheets/ephemeris.css";
      document.head.append(style);
      await new Promise((resolve, reject) => { style.onload = resolve; style.onerror = reject; });
      const root = document.createElement("div"); root.id = "location-test-ephemeris"; document.querySelector(".md-content__inner").append(root);
      (await import('/devotional/assets/ephemeris/ephemeris-app.mjs')).initializeEphemeris(root);
    });
    const eph = page.locator("#location-test-ephemeris");
    const ephReady = () => page.waitForFunction(() => document.querySelector("#location-test-ephemeris [data-status]")?.textContent.startsWith("Calculation complete"));
    await ephReady();
    await eph.locator(".eph-advanced > summary").click();
    assert.ok(await eph.locator(".eph-location").isVisible(), "Location has a dedicated visible section");
    assert.match(await eph.locator("[data-observer-note]").innerText(), /Earth-centred/);
    assert.equal(await eph.locator("[name=latitude]").inputValue(), "27.58");
    assert.equal(await eph.locator("[name=altitude]").inputValue(), "");
    await eph.locator("[name=showLagna]").check();
    await eph.locator("[name=observerMode]").selectOption("topocentric");
    // Exercise real GeolocationCoordinates, not just enumerable object mocks.
    await eph.locator("[data-location]").click();
    await ephReady(); await ready();
    assert.equal(await eph.locator("[name=latitude]").inputValue(), "28.9845");
    assert.equal(await eph.locator("[name=longitude]").inputValue(), "77.7064");
    assert.equal(await input.inputValue(), "Current location (session only)");
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("abp-panchang-settings-v1"))), saved);
    await eph.locator("[data-reset]").click();
    await ephReady(); await ready();
    assert.match(await eph.locator("[name=city]").inputValue(), /Vrindavan/);
    assert.equal(await eph.locator("[name=observerMode]").inputValue(), "geocentric");
    assert.equal(await eph.locator("[name=showLagna]").isEnabled(), true);
    await eph.locator("[name=showLagna]").check();
    await eph.locator("[name=observerMode]").selectOption("topocentric");
    await page.evaluate(() => {
      navigator.geolocation.getCurrentPosition = (success, _, options) => {
        window.testGeoOptions = options;
        success({ coords: { latitude: 28.98, longitude: 77.71, altitude: null, accuracy: 7 } });
      };
    });
    await eph.locator("[data-location]").click();
    await ephReady(); await ready();
    assert.equal(await page.evaluate(() => window.testGeoOptions.enableHighAccuracy), true);
    assert.equal(await input.inputValue(), "Current location (session only)");
    assert.equal(await eph.locator("[name=altitude]").inputValue(), "");
    assert.match(await eph.locator("[data-lagna]").innerText(), /28.98/);
    assert.match(await eph.locator("[data-location-status]").innerText(), /accuracy ±7 m/);
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("abp-panchang-settings-v1"))), saved, "GPS never overwrites saved city");
    for (const code of [1, 2, 3]) {
      await page.evaluate((code) => { navigator.geolocation.getCurrentPosition = (_, failure) => failure({ code }); }, code);
      await eph.locator("[data-location]").click();
      assert.match(await eph.locator("[data-location-message]").innerText(), /previous location has been kept/);
      assert.equal(await eph.locator("[name=latitude]").inputValue(), "28.98");
    }
    await eph.locator("[name=latitude]").fill("29");
    await eph.locator("[name=latitude]").dispatchEvent("change");
    await eph.locator("[data-location-manual]").click();
    await ephReady(); await ready();
    assert.equal(await input.inputValue(), "Manual location");
    assert.equal(await page.evaluate(() => document.querySelector('[data-location-latitude]').value), "29");
    assert.deepEqual(await page.evaluate(() => JSON.parse(localStorage.getItem("abp-panchang-settings-v1"))), saved);
    assert.match(await eph.locator("[data-observer-note]").innerText(), /actively used/);
    await eph.locator("[data-mode=date]").click();
    await eph.locator("[name=date]").fill("2026-10-03");
    await eph.locator("[name=time]").fill("12:00:00");
    await eph.locator("[data-calculate]").click(); await ephReady();
    await eph.locator("[data-share]").click();
    assert.match(await eph.locator("[data-status]").innerText(), /Check Include coordinates/);
    await page.evaluate(() => { navigator.clipboard.writeText = async (text) => { window.locationTestShare = text; }; });
    await eph.locator("[data-share-location]").check();
    await eph.locator("[data-share]").click();
    const share = await page.evaluate(() => window.locationTestShare);
    assert.equal(new URL(share).searchParams.get("lat"), "29");
    const resultBeforeShare = await eph.locator("[data-lagna]").innerText();
    const shared = await context.newPage();
    // This test embeds Ephemeris on a Panchang document; reproduce the same
    // query on the real Ephemeris route, as a normal share recipient would.
    await shared.goto(base + "tools/indian-ephemeris/" + new URL(share).search);
    await shared.waitForFunction(() => document.querySelector("[data-status]")?.textContent.startsWith("Calculation complete"));
    assert.equal(await shared.locator("[name=city]").inputValue(), "Shared manual location");
    assert.equal(await shared.locator("[name=latitude]").inputValue(), "29");
    assert.equal(await shared.locator("[data-lagna]").innerText().then((text) => text.split("absolute ")[1]), resultBeforeShare.split("absolute ")[1], "shared URL reproduces Lagna and houses");
    assert.deepEqual(await shared.evaluate(() => JSON.parse(localStorage.getItem("abp-panchang-settings-v1"))), saved);
    await shared.close();
    await eph.locator("[name=latitude]").fill("91");
    assert.equal(await eph.locator("[data-results]").isVisible(), false, "invalid edits immediately hide old results");
    await eph.locator("[data-calculate]").click();
    assert.equal(await eph.locator("[data-results]").isVisible(), false);
    await eph.locator("[data-reset]").click(); await ephReady(); await ready();
    assert.match(await input.inputValue(), /Vrindavan/);
    await eph.locator("[name=city]").fill("  Meerut   UP  ");
    await eph.locator("[name=city]").press("Enter");
    await ephReady(); await ready();
    assert.equal(await eph.locator("[name=latitude]").inputValue(), "28.9845");
    assert.equal(await eph.locator("[name=timezone]").inputValue(), "Asia/Kolkata");
    // A delayed GPS callback must not undo a later explicit preset selection.
    await page.evaluate(() => { navigator.geolocation.getCurrentPosition = (success) => { window.lateGPS = success; }; });
    await eph.locator("[data-location]").click();
    await eph.locator("[name=city]").fill("Mumbai, Maharashtra");
    await eph.locator("[name=city]").press("Enter");
    await ephReady(); await ready();
    await page.evaluate(() => window.lateGPS({ coords: { latitude: 1, longitude: 2, altitude: 3, accuracy: 10 } }));
    assert.equal(await eph.locator("[name=latitude]").inputValue(), "19.076");
    await input.fill("Unavailable");
    await page.locator("[data-panchang-view] [data-location-search]").click();
    await page.locator("[data-panchang-view] [data-location-message]").filter({ hasText: "service is busy" }).waitFor();
    assert.equal(await eph.locator("[name=city]").inputValue(), "Mumbai, Maharashtra");
    await eph.locator("[name=city]").fill("London"); await eph.locator("[name=city]").press("Enter");
    await ephReady(); await ready();
    assert.equal(await eph.locator("[name=timezone]").inputValue(), "Europe/London");
    assert.equal(await eph.locator("[name=latitude]").inputValue(), "51.50853");
    await eph.locator("[data-reset]").click(); await ephReady();
    assert.equal(await eph.locator("[name=city]").inputValue(), "London, United Kingdom");
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "location UI remains responsive");
    assert.deepEqual(errors, []);
    if (process.env.PANCHANG_SCREENSHOTS) await eph.screenshot({ path: `${process.env.PANCHANG_SCREENSHOTS}/location-complete-${width}.png` });
    await page.reload(); await ready();
    assert.equal(await input.inputValue(), "London, United Kingdom", "saved preset restored on reload, no device persistence");
    await page.goto(base + "tools/indian-ephemeris/");
    await page.waitForFunction(() => document.querySelector("[data-status]")?.textContent.startsWith("Calculation complete"));
    await page.locator("[data-location]").click();
    await page.waitForFunction(() => document.querySelector("[name=city]")?.value === "Current location (session only)" && !document.querySelector("[name=city]").disabled);
    await page.evaluate(() => { window.locationInstantMarker = true; });
    if (width < 1200) await page.locator(".abp-menu-toggle").click();
    await page.locator("#abp-navigation .abp-navigation__section").first().click();
    await page.locator("#abp-navigation").getByRole("link", { name: "Today’s Panchang", exact: true }).click();
    await ready();
    assert.equal(await page.evaluate(() => window.locationInstantMarker), true, "Material navigation did not reload the document");
    assert.equal(await input.inputValue(), "Current location (session only)");
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("abp-panchang-settings-v1")).location.id), "london");
    await page.goBack();
    await page.waitForFunction(() => document.querySelector("[name=city]")?.value === "Current location (session only)" && !document.querySelector("[name=city]").disabled);
    await page.locator("[data-reset]").click();
    await page.waitForFunction(() => document.querySelector("[name=city]")?.value === "London, United Kingdom" && !document.querySelector("[name=city]").disabled);
    if (process.env.PANCHANG_SCREENSHOTS) {
      await page.evaluate(() => scrollTo(0, 0));
      await page.screenshot({ path: `${process.env.PANCHANG_SCREENSHOTS}/location-complete-${width}.png`, fullPage: true });
    }
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`PASS location workflow ${width}px: explicit search, ambiguity, offline cache, unknown elevation, GPS automatic Lagna/topocentric recalculation, manual sync, error retention, stale GPS, privacy`);
  }
}
