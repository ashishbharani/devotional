// SPDX-License-Identifier: AGPL-3.0-or-later
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { localCivilTimeToUTC, parseCivil, zonedParts, julianDayUT, monthDates } from "../docs/assets/ephemeris/time-conversion.mjs";
import { normalizeLongitude, classifyLongitude, ketuLongitude, motionForSpeed, formatAngle } from "../docs/assets/ephemeris/zodiac.mjs";
import { loadEphemerisEngine, calculateEphemeris, verifyData } from "../docs/assets/ephemeris/ephemeris-engine.mjs";
import { calculateMonth, findMonthEvents } from "../docs/assets/ephemeris/monthly.mjs";
import { exportCSV } from "../docs/assets/ephemeris/csv-export.mjs";

const convert = (date, time, extra = {}) => localCivilTimeToUTC({ date, time, timezone: "Asia/Kolkata", ...extra });
const defaults = { ayanamsha: "lahiri", nodeMode: "mean", observerMode: "geocentric", latitude: 28.6139, longitude: 77.209, altitude: 216, showLagna: false, modern: false };

test("IST to UTC regression, previous day and year boundaries", () => {
  assert.equal(convert("2026-10-03", "08:55").instantUTC, "2026-10-03T03:25:00.000Z");
  assert.equal(convert("2026-10-03", "00:15").instantUTC, "2026-10-02T18:45:00.000Z");
  assert.equal(convert("2026-01-01", "00:15").instantUTC, "2025-12-31T18:45:00.000Z");
  assert.equal(convert("2024-03-01", "00:15").instantUTC, "2024-02-29T18:45:00.000Z");
  assert.equal(convert("2026-10-03", "08:55").offsetSeconds, 19800);
});
test("Gregorian leap days, invalid dates and Julian day UT", () => {
  assert.equal(convert("2024-02-29", "05:30").instantUTC, "2024-02-29T00:00:00.000Z");
  assert.throws(() => parseCivil("2025-02-29", "12:00"));
  assert.throws(() => parseCivil("2100-02-29", "12:00"));
  assert.throws(() => parseCivil("2024-01-01", "24:00"));
  assert.equal(monthDates(2024, 2).length, 29);
  assert.equal(monthDates(2100, 2).length, 28);
  assert.equal(julianDayUT("2000-01-01T12:00:00Z"), 2451545);
  assert.equal(julianDayUT("2026-10-03T00:00:00Z"), 2461316.5);
});
test("historical India keeps offset seconds and manual offset", () => {
  const historic = convert("1850-01-01", "12:00");
  assert.notEqual(historic.offsetSeconds, 19800);
  assert.deepEqual(zonedParts(historic.instantUTC, "Asia/Kolkata").time, "12:00:00");
  assert.equal(convert("1850-01-01", "12:00", { manualOffset: "+05:53:28" }).instantUTC, "1850-01-01T06:06:32.000Z");
  assert.ok(historic.warning);
  assert.throws(() => convert("2026-10-03", "08:55", { timezone: "Invalid/Zone" }));
  assert.throws(() => convert("2026-10-03", "08:55", { manualOffset: "+14:01" }));
});
test("IANA DST gaps, folds and non-India civil dates", () => {
  assert.throws(() => convert("2026-03-08", "02:30", { timezone: "America/New_York" }), /does not exist/);
  assert.throws(() => convert("2026-11-01", "01:30", { timezone: "America/New_York" }), /ambiguous/);
  assert.equal(convert("2026-11-01", "01:30", { timezone: "America/New_York", manualOffset: "-04:00" }).instantUTC, "2026-11-01T05:30:00.000Z");
  assert.equal(convert("2026-01-01", "23:30", { timezone: "America/New_York" }).instantUTC, "2026-01-02T04:30:00.000Z");
});
test("normalization, exact Rashi and rational Nakshatra/Pada boundaries", () => {
  for (const [input, expected] of [[-1, 359], [360, 0], [361, 1]]) assert.equal(normalizeLongitude(input), expected);
  assert.equal(classifyLongitude(0).rashi.name, "Mesha");
  assert.equal(classifyLongitude(30 - 1 / 3600).rashi.name, "Mesha");
  assert.equal(classifyLongitude(30).rashi.name, "Vrishabha");
  assert.equal(classifyLongitude(360 - 1 / 3600).rashi.name, "Meena");
  assert.equal(classifyLongitude(47.25).degreeInRashi, 17.25);
  for (let index = 0; index < 108; index += 1) {
    const point = index * 10 / 3;
    const result = classifyLongitude(point);
    assert.equal(result.pada, index % 4 + 1, `Pada boundary ${index}`);
    assert.equal(result.nakshatraIndex, Math.floor(index / 4), `Nakshatra boundary ${index}`);
    if (index) assert.equal(classifyLongitude(point - 1e-8).pada, (index - 1) % 4 + 1, `before Pada ${index}`);
  }
  assert.equal(classifyLongitude(360).nakshatra, "Ashwini");
  assert.equal(classifyLongitude(360 - 1e-8).nakshatra, "Revati");
  assert.equal(formatAngle(359.99999999), "359°59′59″");
  assert.equal(formatAngle(29.99999999, "seconds", 30), "29°59′59″");
});
test("Ketu opposition and motion use unrounded speed", () => {
  for (const rahu of [0, 180, 359.9999, -1, 30.25]) assert.equal(normalizeLongitude(ketuLongitude(rahu) - normalizeLongitude(rahu)), 180);
  assert.equal(motionForSpeed(-0.08), "Retrograde ℞");
  assert.equal(motionForSpeed(0.08), "Direct");
  assert.equal(motionForSpeed(-0.000001), "Near station");
});

const engine = await loadEphemerisEngine((file) => readFile(new URL(`../docs/assets/ephemeris/vendor/data-0.2.2/${file}`, import.meta.url)));
test("dataset checksums fail closed, fallback withheld, locations validated", async () => {
  await assert.rejects(verifyData(new Uint8Array([1, 2]), "invalid"), /checksum/);
  assert.throws(() => calculateEphemeris(engine, { ...defaults, instantUTC: "1799-12-31T23:59:59Z" }), /outside/);
  assert.throws(() => calculateEphemeris(engine, { ...defaults, instantUTC: "2026-10-03T03:25:00Z", observerMode: "topocentric", latitude: null }), /location/);
  assert.throws(() => calculateEphemeris(engine, { ...defaults, instantUTC: "2026-10-03T03:25:00Z", ayanamsha: "invented" }), /ayanamsha/);
  const { createSwissEph } = await import("../docs/assets/ephemeris/vendor/swiss-0.2.2/dist/instance.js");
  const empty = await createSwissEph();
  assert.throws(() => calculateEphemeris(empty, { ...defaults, instantUTC: "2026-10-03T03:25:00Z" }), /Moshier fallback/);
  empty.dispose();
});
test("monthly core, explicit sampling time, exports, stations refined", () => {
  const request = { year: 2026, month: 10, referenceTime: "00:00:00", timezone: "Asia/Kolkata", manualOffset: null, settings: defaults };
  const month = calculateMonth(engine, request);
  assert.equal(month.rows.length, 31);
  assert.equal(month.rows[0].result.instantUTC, "2026-09-30T18:30:00.000Z");
  assert.equal(month.rows[30].result.instantUTC, "2026-10-30T18:30:00.000Z");
  const noon = calculateMonth(engine, { ...request, referenceTime: "12:00:00" });
  assert.notEqual(month.rows[0].result.planets[1].longitude, noon.rows[0].result.planets[1].longitude);
  const csv = exportCSV(month.rows, month);
  for (const text of ["Timezone", "Asia/Kolkata", "00:00:00", "Swiss Ephemeris 2.10.03", "DE441", "Speed degrees/day"]) assert.ok(csv.includes(text));
  assert.equal(csv.split('\r\n').filter((line) => line.startsWith('"2026-10-')).length, 31 * 9);
  const events = findMonthEvents(engine, request);
  const venusStation = events.find((e) => e.body === "Shukra / Venus" && e.event === "Retrograde station");
  assert.ok(venusStation, "Venus station on 3 October must be found");
  const instant = new Date(venusStation.instantUTC).getTime();
  const before = calculateEphemeris(engine, { ...defaults, instantUTC: new Date(instant - 2000).toISOString() }).planets[5];
  const after = calculateEphemeris(engine, { ...defaults, instantUTC: new Date(instant + 2000).toISOString() }).planets[5];
  assert.ok(before.speed > 0 && after.speed < 0, "refined station actually straddles the speed-zero root");
});

test("full-precision independent native Swiss Ephemeris golden references", async () => {
  const golden = JSON.parse(await readFile(new URL("./fixtures/ephemeris-golden.json", import.meta.url), "utf8"));
  let maxLongitude = 0;
  let maxSpeed = 0;
  let maxAyanamsha = 0;
  let maxHouses = 0;
  for (const fixture of golden.cases) {
    for (const nodeMode of ["mean", "true"]) {
      const result = calculateEphemeris(engine, { ...defaults, instantUTC: fixture.instantUTC,
        ayanamsha: fixture.ayanamsha, observerMode: fixture.observerMode, nodeMode, modern: true, showLagna: true });
      assert.equal(result.jdUT, fixture.jdUT);
      const ayanDifference = Math.abs(result.ayanamshaValue - fixture.ayanamshaValue);
      maxAyanamsha = Math.max(maxAyanamsha, ayanDifference);
      assert.ok(ayanDifference <= golden.toleranceDegrees, `ayanamsha ${fixture.ayanamsha}`);
      for (const planet of [...result.planets.filter((p) => p.key !== "ketu"), ...result.modern]) {
        const ref = fixture.positions.find((item) => item.body === planet.id).values;
        const diff = Math.abs(planet.longitude - ref[0]);
        const speedDiff = Math.abs(planet.speed - ref[3]);
        maxLongitude = Math.max(maxLongitude, diff); maxSpeed = Math.max(maxSpeed, speedDiff);
        assert.ok(diff <= golden.toleranceDegrees, `${fixture.instantUTC} ${fixture.ayanamsha} ${fixture.observerMode} ${planet.name}: longitude Δ=${diff}`);
        assert.ok(Math.abs(planet.latitude - ref[1]) <= golden.toleranceDegrees, `${planet.name}: latitude`);
        assert.ok(Math.abs(planet.distance - ref[2]) <= golden.toleranceAU, `${planet.name}: distance`);
        assert.ok(speedDiff <= golden.toleranceSpeedDegreesPerDay, `${planet.name}: speed Δ=${speedDiff}`);
      }
      assert.ok(Math.abs(result.lagna.longitude - fixture.houses.W.ascendant) <= golden.toleranceDegrees);
      for (const houseSystem of ["W", "A", "S", "P"]) {
        const housesResult = calculateEphemeris(engine, { ...result.settings, houseSystem });
        housesResult.houses.cusps.forEach((cusp, i) => {
          const diff = Math.abs(cusp - fixture.houses[houseSystem].cusps[i]);
          maxHouses = Math.max(maxHouses, diff);
          assert.ok(diff <= golden.toleranceDegrees, `${houseSystem} cusp ${i}`);
        });
      }
      const [rahu, ketu] = result.planets.slice(7);
      assert.equal(ketu.longitude, ketuLongitude(rahu.longitude));
      assert.ok(Math.abs(normalizeLongitude(ketu.longitude - rahu.longitude) - 180) <= Number.EPSILON * 360);
      assert.equal(ketu.speed, rahu.speed);
      if (!result.sidereal) assert.equal(result.planets[0].nakshatra, null);
    }
  }
  console.log(JSON.stringify({ nativeCases: golden.cases.length, nodeVariants: 2, maxLongitudeDegrees: maxLongitude,
    maxSpeedDegreesPerDay: maxSpeed, maxAyanamshaDegrees: maxAyanamsha, maxHouseDegrees: maxHouses }));
  engine.dispose();
});
