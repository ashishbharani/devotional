import assert from "node:assert/strict";
import "./test_location_settings.mjs";
import { readFile } from "node:fs/promises";
import { INDIAN_CITIES } from "../docs/assets/panchang/settings.mjs";
import {
  calculatePanchangDay,
  calculatePanchangMonth,
  clearPanchangCache,
  printRiseSetValidation,
} from "../docs/assets/panchang/panchang-adapter.mjs";
import {
  instantForLocalTime,
  isEventOnLocalCivilDate,
  isEventWithinHinduDay,
  localDateKey,
  localDayBounds,
  parseDateKey,
  shiftDateKey,
  timezoneOffsetForInstant,
} from "../docs/assets/panchang/date-time.mjs";
import { GOLDEN_DAYS, GOLDEN_TOLERANCE_MINUTES } from "./fixtures/panchang-golden.mjs";
import { limbSegments, boundary, tithiIndex } from "../docs/assets/panchang/tithi.mjs";
import { limbAngle, moonEvents } from "../docs/assets/panchang/astronomy.mjs";
import { astronomy } from "../docs/assets/panchang/panchang-engine.mjs";
import { calculateShubhMuhurtas } from "../docs/assets/panchang/muhurta.mjs";
import { formatTime, formatMoonEvent, tithiRows, muhurtaRows } from "../docs/assets/panchang/panchang-display.mjs";
import { INDEPENDENT_DAYS } from "./fixtures/panchang-independent.mjs";
import { MOON_REFERENCES } from "./fixtures/moon-reference.mjs";

const DELHI = INDIAN_CITIES.find((city) => city.id === "delhi");
const settings = (location = DELHI, convention = "amanta") => ({ location, convention });
const city = (id) => {
  const result = INDIAN_CITIES.find((item) => item.id === id);
  assert.ok(result, `city preset exists: ${id}`);
  return result;
};

const tests = [];
function test(name, run) {
  tests.push({ name, run });
}

function localMinutes(value, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(value);
  const read = (type) => Number(parts.find((part) => part.type === type)?.value);
  return read("hour") * 60 + read("minute");
}

function expectedMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function minuteDifference(actual, expected, timeZone) {
  const difference = Math.abs(localMinutes(actual, timeZone) - expectedMinutes(expected));
  return Math.min(difference, 1440 - difference);
}

test("canonical civil-date helpers reject rollover dates and handle leap/year boundaries", () => {
  assert.deepEqual(parseDateKey("2024-02-29"), { year: 2024, month: 2, day: 29 });
  assert.equal(parseDateKey("2025-02-29"), null);
  assert.equal(parseDateKey("2026-02-31"), null);
  assert.equal(shiftDateKey("2024-02-28", 1), "2024-02-29");
  assert.equal(shiftDateKey("2024-02-29", 1), "2024-03-01");
  assert.equal(shiftDateKey("2026-12-31", 1), "2027-01-01");
});

test("IANA offsets are date-sensitive and do not depend on the host timezone", () => {
  const winter = instantForLocalTime("2026-01-15", { hour: 12 }, "America/New_York", -300);
  const summer = instantForLocalTime("2026-07-15", { hour: 12 }, "America/New_York", -300);
  assert.equal(timezoneOffsetForInstant(winter, "America/New_York"), -300);
  assert.equal(timezoneOffsetForInstant(summer, "America/New_York"), -240);
  assert.equal(localDateKey(winter, "America/New_York"), "2026-01-15");
  assert.equal(localDateKey(summer, "America/New_York"), "2026-07-15");
});

test("local civil-day boundaries do not leak an adjacent-day event", () => {
  assert.equal(isEventOnLocalCivilDate(new Date("2026-10-02T18:29:00Z"), "2026-10-02", "Asia/Kolkata"), true);
  assert.equal(isEventOnLocalCivilDate(new Date("2026-10-02T18:30:00Z"), "2026-10-02", "Asia/Kolkata"), false);
});

test("daily result uses sunrise state and retains every sunrise-to-sunrise transition", async () => {
  const day = await calculatePanchangDay("2026-10-02", settings());
  assert.equal(day.sunriseTithi.name, "Shashthi");
  assert.equal(day.sunriseNakshatra.name, "Mrigashira");
  assert.deepEqual(day.tithiTransitions.map((item) => item.name), ["Shashthi", "Saptami"]);
  assert.deepEqual(day.nakshatraTransitions.map((item) => item.name), ["Mrigashira", "Ardra"]);
  assert.ok(day.yogaTransitions.length >= 2);
  assert.ok(day.karanaTransitions.length >= 2);
  for (const group of [day.tithiTransitions, day.nakshatraTransitions, day.yogaTransitions, day.karanaTransitions]) {
    for (const item of group) {
      assert.ok(isEventWithinHinduDay(item.withinDay.start, day.sunrise, day.nextSunrise));
      assert.ok(item.start <= item.withinDay.start && item.end >= item.withinDay.end, "true intervals encompass clipped display intervals");
    }
  }
});

test("golden/reference Panchang values remain within documented tolerances", async () => {
  for (const fixture of GOLDEN_DAYS) {
    const day = await calculatePanchangDay(fixture.date, settings(fixture.location));
    assert.equal(day.sunriseTithi.name, fixture.expected.tithi, `${fixture.city}: Tithi`);
    assert.equal(day.sunriseNakshatra.name, fixture.expected.nakshatra, `${fixture.city}: Nakshatra`);
    assert.equal(day.paksha, fixture.expected.paksha, `${fixture.city}: Paksha`);
    assert.equal(day.masa.name, fixture.expected.masa, `${fixture.city}: Masa`);
    const values = {
      sunrise: day.sunrise,
      sunset: day.sunset,
      moonrise: day.moonrise,
      moonset: day.moonset,
      tithiEnd: day.tithiTransitions[0].end,
      nakshatraEnd: day.nakshatraTransitions[0].end,
    };
    for (const [field, actual] of Object.entries(values)) {
      assert.ok(actual, `${fixture.city}: ${field} exists`);
      const difference = minuteDifference(actual, fixture.expected[field], fixture.location.timezone);
      assert.ok(difference <= GOLDEN_TOLERANCE_MINUTES[field], `${fixture.city}: ${field} differs by ${difference} minutes (tolerance ${GOLDEN_TOLERANCE_MINUTES[field]})`);
    }
  }
});

test("Moonrise and Moonset belong to the requested local date or remain honestly null", async () => {
  const ordinary = await calculatePanchangDay("2026-10-02", settings());
  assert.equal(isEventOnLocalCivilDate(ordinary.moonrise, ordinary.date, DELHI.timezone), true);
  assert.equal(isEventOnLocalCivilDate(ordinary.moonset, ordinary.date, DELHI.timezone), true);

  const noRise = await calculatePanchangDay("2026-01-10", settings());
  assert.equal(noRise.moonrise, null, "no following-day Moonrise is borrowed");
  assert.match(noRise.warnings.join(" "), /No Moonrise occurs/);
  const nextRise = await calculatePanchangDay("2026-01-11", settings());
  assert.equal(isEventOnLocalCivilDate(nextRise.moonrise, "2026-01-11", DELHI.timezone), true);

  const noSet = await calculatePanchangDay("2026-01-25", settings());
  assert.equal(noSet.moonset, null, "no following-day Moonset is borrowed");
  assert.match(noSet.warnings.join(" "), /No Moonset occurs/);
});

test("all required Indian city presets use their coordinates and recalculate astronomy", async () => {
  const required = ["delhi", "varanasi", "mumbai", "ahmedabad", "jaipur", "kolkata", "guwahati", "chennai", "bengaluru", "hyderabad", "kochi", "srinagar"];
  const sunriseTimes = new Set();
  for (const id of required) {
    const location = city(id);
    assert.equal(location.timezone, "Asia/Kolkata", `${id}: timezone`);
    assert.ok(Number.isFinite(location.latitude) && Number.isFinite(location.longitude), `${id}: coordinates`);
    const day = await calculatePanchangDay("2026-10-02", settings(location));
    assert.ok(day.sunrise < day.sunset, `${id}: sunrise before sunset`);
    assert.equal(isEventOnLocalCivilDate(day.sunrise, day.date, location.timezone), true, `${id}: sunrise local date`);
    assert.equal(isEventOnLocalCivilDate(day.sunset, day.date, location.timezone), true, `${id}: sunset local date`);
    sunriseTimes.add(day.sunrise.getTime());
  }
  assert.ok(sunriseTimes.size > 8, "city calculations are not reused from Delhi");
});

test("Amanta/Purnimanta changes Masa only, not astronomical events", async () => {
  const amanta = await calculatePanchangDay("2026-10-02", settings(DELHI, "amanta"));
  const purnimanta = await calculatePanchangDay("2026-10-02", settings(DELHI, "purnimanta"));
  assert.notEqual(amanta.masa.name, purnimanta.masa.name);
  assert.equal(amanta.masa.name, "Bhadrapada");
  assert.equal(purnimanta.masa.name, "Ashwina");
  for (const field of ["sunrise", "sunset", "moonrise", "moonset"]) assert.equal(amanta[field]?.getTime(), purnimanta[field]?.getTime(), field);
  assert.equal(amanta.sunriseTithi.index, purnimanta.sunriseTithi.index);
  assert.equal(amanta.sunriseNakshatra.index, purnimanta.sunriseNakshatra.index);
});

test("Adhika Masa is retained", async () => {
  const day = await calculatePanchangDay("2026-05-17", settings());
  assert.equal(day.masa.isAdhika, true);
  assert.equal(day.masa.name, "Jyeshtha");
});

test("confirmed repeated and skipped sunrise Tithis are represented without one-date assumptions", async () => {
  const repeatedA = await calculatePanchangDay("2026-01-09", settings());
  const repeatedB = await calculatePanchangDay("2026-01-10", settings());
  assert.equal(repeatedA.sunriseTithi.index, repeatedB.sunriseTithi.index, "Vriddhi/repeated Saptami");

  const skippedA = await calculatePanchangDay("2026-01-06", settings());
  const skippedB = await calculatePanchangDay("2026-01-07", settings());
  assert.equal((skippedB.sunriseTithi.index - skippedA.sunriseTithi.index + 30) % 30, 2, "Kshaya/skipped sunrise Tithi");
  assert.ok(skippedA.tithiTransitions.length >= 2, "intra-Hindu-day transition is retained");
});

test("Rahu Kalam and other day intervals are valid and ordered", async () => {
  const day = await calculatePanchangDay("2026-10-02", settings());
  for (const [name, interval] of Object.entries({ rahu: day.rahuKalam, yamaganda: day.yamaganda, gulika: day.gulika, abhijit: day.abhijitMuhurta })) {
    assert.ok(interval?.start instanceof Date && interval?.end instanceof Date, `${name}: interval exists`);
    assert.ok(interval.start < interval.end, `${name}: interval ordered`);
  }
});

test("complete monthly models are continuous, sunrise-based and location-specific", async () => {
  const required = ["delhi", "varanasi", "mumbai", "kolkata", "guwahati", "chennai", "bengaluru"];
  const firstSunrises = new Set();
  for (const id of required) {
    const location = city(id);
    const month = await calculatePanchangMonth(2026, 10, settings(location));
    assert.equal(month.length, 31, `${id}: October day count`);
    month.forEach((day, index) => {
      assert.equal(day.date, `2026-10-${String(index + 1).padStart(2, "0")}`, `${id}: continuous civil dates`);
      assert.ok(!day.error, `${id} ${day.date}: no calculation error`);
      assert.ok(day.sunrise < day.sunset, `${id} ${day.date}: valid Sun events`);
      assert.ok(day.sunriseTithi?.name, `${id} ${day.date}: sunrise Tithi`);
      assert.ok(day.sunriseNakshatra?.name, `${id} ${day.date}: sunrise Nakshatra`);
      if (day.moonrise) assert.equal(isEventOnLocalCivilDate(day.moonrise, day.date, location.timezone), true, `${id} ${day.date}: Moonrise civil date`);
      if (day.moonset) assert.equal(isEventOnLocalCivilDate(day.moonset, day.date, location.timezone), true, `${id} ${day.date}: Moonset civil date`);
      assert.equal(day.festivals.some((festival) => festival.type === "span"), false, `${id} ${day.date}: unsafe spans excluded`);
    });
    firstSunrises.add(month[0].sunrise.getTime());
  }
  assert.equal(firstSunrises.size, required.length, "month recalculates after city changes");
});

test("February/leap and December/January monthly boundaries remain exact", async () => {
  clearPanchangCache();
  const leap = await calculatePanchangMonth(2024, 2, settings());
  const common = await calculatePanchangMonth(2025, 2, settings());
  const december = await calculatePanchangMonth(2026, 12, settings());
  assert.equal(leap.length, 29);
  assert.equal(leap.at(-1).date, "2024-02-29");
  assert.equal(common.length, 28);
  assert.equal(common.at(-1).date, "2025-02-28");
  assert.equal(december.length, 31);
  assert.equal(december.at(-1).date, "2026-12-31");
  assert.equal(shiftDateKey(december.at(-1).date, 1), "2027-01-01");
});

test("six cities across lunar phases retain civil dates, distinct events and unchanged engine fields", async () => {
  for (const date of ["2026-01-03", "2026-01-10", "2026-01-18", "2026-01-25", "2026-04-02", "2026-07-14", "2026-10-03"]) {
    const rises = new Set();
    const sets = new Set();
    for (const id of ["delhi", "mumbai", "kolkata", "chennai", "bengaluru", "varanasi"]) {
      const location = city(id);
      const result = await calculatePanchangDay(date, settings(location));
      assert.equal(result.timezone, location.timezone);
      assert.equal(result.location.latitude, location.latitude);
      for (const field of ["moonrise", "moonset"]) {
        const value = result[field];
        assert.ok(value === null || isEventOnLocalCivilDate(value, date, location.timezone), `${id} ${date}: ${field}`);
        if (value) (field === "moonrise" ? rises : sets).add(value.getTime());
      }
      for (const field of ["sunrise", "sunset"]) assert.equal(result[field].getTime(), result.raw[field].getTime(), `${field} unchanged`);
      assert.equal(result.sunriseTithi.index, result.raw.tithi);
      assert.equal(result.sunriseNakshatra.index, result.raw.nakshatra);
      assert.equal(result.sunriseYoga.index, result.raw.yoga);
      assert.equal(result.sunriseKarana.name, result.raw.karana);
    }
    assert.ok(rises.size > 1, `${date}: Moonrise is location-specific`);
    assert.ok(sets.size > 1, `${date}: Moonset is location-specific`);
  }
});

test("daily/monthly lunar events agree and Moonset may precede Moonrise", async () => {
  const ordinary = await calculatePanchangDay("2026-10-03", settings());
  assert.ok(ordinary.moonset < ordinary.moonrise);
  const next = await calculatePanchangDay("2026-10-04", settings());
  assert.notEqual(ordinary.moonrise?.getTime(), next.moonrise?.getTime());
  assert.notEqual(ordinary.moonset?.getTime(), next.moonset?.getTime());
  for (const id of ["delhi", "mumbai", "kolkata", "chennai", "bengaluru", "varanasi"]) {
    const selected = settings(city(id));
    const month = await calculatePanchangMonth(2026, 10, selected);
    for (const monthly of month) {
      const daily = await calculatePanchangDay(monthly.date, selected);
      for (const field of ["sunrise", "sunset", "moonrise", "moonset"]) assert.equal(monthly[field]?.getTime(), daily[field]?.getTime());
    }
  }
  assert.equal(instantForLocalTime("2026-10-03", { hour: 0 }, "Asia/Kolkata").toISOString(), "2026-10-02T18:30:00.000Z");
});

test("Moonrise/Moonset cross-check independent native Swiss rise/set reference", async () => {
  const fixtures = JSON.parse(await readFile(new URL("./fixtures/moonrise-native.json", import.meta.url), "utf8"));
  let maximumSeconds = 0;
  for (const fixture of fixtures.cases) {
    const day = await calculatePanchangDay(fixture.date, settings(city(fixture.city)));
    for (const field of ["moonrise", "moonset"]) {
      if (fixture[field] === null) assert.equal(day[field], null, `${fixture.city} ${fixture.date}: no ${field}`);
      else {
        assert.ok(day[field], `${fixture.city} ${fixture.date}: ${field} exists`);
        const seconds = Math.abs(day[field].getTime() - new Date(fixture[field]).getTime()) / 1000;
        maximumSeconds = Math.max(maximumSeconds, seconds);
        // Independent engines/refraction models, not same-engine precision.
        assert.ok(seconds <= 120, `${fixture.city} ${fixture.date}: ${field} differs ${seconds}s`);
      }
    }
  }
  console.log(`Native lunar rise/set cross-check: ${fixtures.cases.length} cases; maximum difference ${maximumSeconds.toFixed(3)} seconds`);
});

let passed = 0;
for (const { name, run } of tests) {
  await run();
  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}
console.log(`Panchang regression suite passed: ${passed}/${tests.length} groups`);
