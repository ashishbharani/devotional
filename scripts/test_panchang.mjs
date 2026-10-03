import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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

test("tithi numbers, Purnima/Amavasya and exact wrapped boundaries", async () => {
  for (let index = 0; index < 30; index += 1) assert.equal(tithiIndex(index * 12), index);
  assert.equal(tithiIndex(360), 0);
  assert.equal(tithiIndex(-0.001), 29);
  const { engineNames } = await import("../docs/assets/panchang/panchang-adapter.mjs");
  assert.equal(engineNames.tithiNames[14], "Purnima");
  assert.equal(engineNames.tithiNames[29], "Amavasya");
});

test("real three-segment Kshaya day preserves start/end and the final pre-sunrise segment", async () => {
  const day = await calculatePanchangDay("2026-10-03", settings());
  assert.deepEqual(day.tithis.map((item) => item.name), ["Saptami", "Ashtami", "Navami"]);
  assert.equal(localDateKey(day.tithis[0].start, DELHI.timezone), "2026-10-02");
  assert.equal(localDateKey(day.tithis[1].end, DELHI.timezone), "2026-10-04");
  assert.equal(day.tithis[1].skippedAtSunrise, true);
  assert.ok(day.tithis[2].start < day.nextSunrise);
  assert.ok(day.tithis[2].end > day.nextSunrise);
  for (let i = 1; i < day.tithis.length; i += 1) assert.equal(+day.tithis[i].start, +day.tithis[i - 1].end, "no artificial minute gaps");
  for (const item of day.tithis) {
    const angularResidual = (date, target) => Math.abs(((limbAngle("tithi", date) - target + 540) % 360) - 180);
    assert.ok(angularResidual(item.end, item.targetAngle) < 0.00005, "actual crossing, not linear estimate");
    assert.ok(angularResidual(item.start, item.index * 12) < 0.00005);
  }
});

test("Vriddhi keeps the same full interval on both sunrise dates; start search exceeds 25 hours", async () => {
  const first = await calculatePanchangDay("2026-01-09", settings());
  const second = await calculatePanchangDay("2026-01-10", settings());
  assert.equal(first.tithis[0].repeatedAtSunrise, true);
  assert.equal(second.tithis[0].repeatedAtSunrise, true);
  assert.ok(Math.abs(first.tithis[0].start - second.tithis[0].start) < 250);
  assert.ok(Math.abs(first.tithis[0].end - second.tithis[0].end) < 250);
  const rise = new Date("2026-01-10T06:00:00Z");
  const slowAngle = (date) => 10.4 + (date - rise) / 3600000 * 0.4;
  const synthetic = limbSegments("tithi", rise, new Date(+rise + 86400000), new Date(+rise - 86400000), slowAngle);
  assert.ok(rise - synthetic[0].start > 25 * 3600000, "long start interval remains searchable");
  assert.equal(synthetic[0].repeatedAtSunrise, true);
});

test("synthetic crossings exercise shortly-after-sunrise, midnight, wrap and unlimited segment count", () => {
  const rise = new Date("2026-12-31T06:00:00Z");
  const next = new Date("2027-01-01T06:00:00Z");
  // Deliberately accelerated synthetic ephemeris to test enumeration, never production data.
  const angle = (date) => 359.9 + (date - rise) / 3600000 * 6;
  const segments = limbSegments("tithi", rise, next, new Date(+rise - 86400000), angle);
  assert.ok(segments.length > 3, "no two-transition cap");
  assert.equal(segments[0].name, "Amavasya");
  assert.equal(segments[1].name, "Prathama", "existing site spelling is retained");
  assert.ok(segments[0].end - rise < 61000);
  assert.ok(segments.some((item) => item.start.getUTCDate() === 31 && item.end.getUTCDate() === 1));
  assert.equal(+boundary(rise, 359.9, -1, angle), +rise);
  assert.ok(segments.at(-1).withinDay.end <= next);
});

test("four Muhurtas use one solar model and varying night/day durations", async () => {
  for (const date of ["2026-01-15", "2026-07-15", "2026-10-03"]) {
    const day = await calculatePanchangDay(date, settings());
    const previous = await calculatePanchangDay(shiftDateKey(date, -1), settings());
    const night = day.sunrise - previous.sunset;
    const daylight = day.sunset - day.sunrise;
    assert.equal(Object.keys(day.shubhMuhurtas).length, 4);
    for (const interval of Object.values(day.shubhMuhurtas)) assert.ok(interval.start < interval.end);
    assert.ok(Math.abs(day.shubhMuhurtas.brahma.start - (day.sunrise - night * 2 / 15)) <= 1);
    assert.ok(Math.abs(day.shubhMuhurtas.brahma.end - (day.sunrise - night / 15)) <= 1);
    assert.ok(Math.abs(day.shubhMuhurtas.abhijit.start - (+day.sunrise + daylight * 7 / 15)) <= 1);
    assert.ok(Math.abs(day.shubhMuhurtas.abhijit.end - (+day.sunrise + daylight * 8 / 15)) <= 1);
    assert.ok(Math.abs(day.shubhMuhurtas.vijaya.start - (+day.sunrise + daylight * 10 / 15)) <= 1);
    assert.ok(Math.abs(day.shubhMuhurtas.vijaya.end - (+day.sunrise + daylight * 11 / 15)) <= 1);
    assert.equal(+day.shubhMuhurtas.godhuli.start, +day.sunset - 720000);
    assert.equal(+day.shubhMuhurtas.godhuli.end, +day.sunset + 720000);
  }
  assert.throws(() => calculateShubhMuhurtas(null, null, null), /unavailable/);
});

test("timezone-local Today and unambiguous full dates survive UTC midnight and display rounding", async () => {
  assert.equal(localDateKey(new Date("2026-10-02T20:00:00Z"), "Asia/Kolkata"), "2026-10-03");
  const day = await calculatePanchangDay("2026-10-03", settings());
  const rows = tithiRows(day, DELHI);
  assert.match(rows[0].start, /02 Oct 2026, 10:16 AM/);
  assert.match(rows[1].end, /04 Oct 2026, 05:52 AM/);
  assert.match(rows[1].status, /Kshaya/);
  assert.equal(muhurtaRows(day, DELHI).length, 4);
  assert.match(formatTime(new Date("2026-10-03T18:29:45Z"), DELHI, day.date), /04 Oct 2026, 12:00 AM/);
});

test("sunrise varies in both seasonal directions, latitude and longitude; non-IST DST days work", async () => {
  const minutes = (date) => localMinutes(date, DELHI.timezone);
  const juneA = await calculatePanchangDay("2026-06-01", settings());
  const juneB = await calculatePanchangDay("2026-06-02", settings());
  const octA = await calculatePanchangDay("2026-10-02", settings());
  const octB = await calculatePanchangDay("2026-10-03", settings());
  assert.ok(minutes(juneB.sunrise) <= minutes(juneA.sunrise));
  assert.ok(minutes(octB.sunrise) >= minutes(octA.sunrise));
  const ny = { name: "New York", latitude: 40.7128, longitude: -74.006, altitude: 10, timezone: "America/New_York", timezoneOffset: -300 };
  for (const date of ["2026-03-08", "2026-11-01"]) {
    const day = await calculatePanchangDay(date, settings(ny));
    assert.equal(localDateKey(day.sunrise, ny.timezone), date);
    assert.equal(localDateKey(day.nextSunrise, ny.timezone), shiftDateKey(date, 1));
    assert.equal(day.panchangaDay.start, day.sunrise);
  }
  const east = await calculatePanchangDay("2026-10-03", settings({ ...DELHI, longitude: DELHI.longitude + 5 }));
  const south = await calculatePanchangDay("2026-10-03", settings({ ...DELHI, latitude: 10 }));
  assert.ok(east.sunrise < octB.sunrise);
  assert.notEqual(+south.sunrise, +octB.sunrise);
});

test("independent nine-city, multi-season references compare complete dated instants", async () => {
  const referenceTime = (text, date, location) => {
    const [datePart, clock] = text.includes(" ") ? text.split(" ") : [date, text];
    const [hour, minute] = clock.split(":").map(Number);
    return instantForLocalTime(datePart, { hour, minute }, location.timezone, 330);
  };
  for (const fixture of INDEPENDENT_DAYS) {
    const location = city(fixture.city);
    const day = await calculatePanchangDay(fixture.date, settings(location));
    assert.equal(day.sunriseTithi.index, fixture.tithi, `${fixture.city}: reference sunrise tithi`);
    assert.equal(day.sunriseNakshatra.name, fixture.nakshatra, `${fixture.city}: reference nakshatra`);
    const events = { sunrise: day.sunrise, sunset: day.sunset, tithiEnd: day.sunriseTithi.end, nakshatraEnd: day.sunriseNakshatra.end };
    let maxSeconds = 0;
    for (const [field, actual] of Object.entries(events)) {
      const seconds = Math.abs(actual - referenceTime(fixture[field], fixture.date, location)) / 1000;
      maxSeconds = Math.max(maxSeconds, seconds);
      assert.ok(seconds <= 120, `${fixture.city} ${field}: ${seconds}s difference`);
    }
    if (fixture.extraTithiEnd) assert.ok(Math.abs(day.tithis[1].end - referenceTime(fixture.extraTithiEnd, fixture.date, location)) <= 120000);
    for (const id of ["brahma", "abhijit", "vijaya"]) {
      // Drik omits Abhijit on Wednesday as a ritual restriction. Our user
      // requested the geometric central daylight interval on every day.
      if (!fixture[id]) continue;
      for (const [index, field] of ["start", "end"].entries()) {
        const seconds = Math.abs(day.shubhMuhurtas[id][field] - referenceTime(fixture[id][index], fixture.date, location)) / 1000;
        maxSeconds = Math.max(maxSeconds, seconds);
        assert.ok(seconds <= 120, `${fixture.city} ${id} ${field}: ${seconds}s difference`);
      }
    }
    const godhuliDeltas = ["start", "end"].map((field, index) => Math.round((day.shubhMuhurtas.godhuli[field] - referenceTime(fixture.godhuli[index], fixture.date, location)) / 60000));
    console.log(`REFERENCE ${fixture.city} ${fixture.date}: max comparable difference ${maxSeconds.toFixed(1)}s; Godhuli convention deltas ${godhuliDeltas.join("/")} min (sunset-centred vs reference evening interval)`);
  }
});

const MOON_CITIES = ["delhi", "mumbai", "kolkata", "chennai", "bengaluru", "varanasi"];

test("six-city lunar phase matrix uses the exact local civil date and recalculates both events", async () => {
  const dates = ["2026-01-03", "2026-01-10", "2026-01-18", "2026-01-26", "2026-07-15", "2026-10-03"];
  const rises = new Set();
  const sets = new Set();
  for (const id of MOON_CITIES) {
    const location = city(id);
    const dateRises = new Set();
    const dateSets = new Set();
    const counts = { moonrise: 0, moonset: 0 };
    for (const date of dates) {
      const day = await calculatePanchangDay(date, settings(location));
      const bounds = localDayBounds(date, location.timezone);
      const observer = new astronomy.Observer(location.latitude, location.longitude, location.altitude);
      for (const [field, direction] of [["moonrise", 1], ["moonset", -1]]) {
        const expected = astronomy.SearchRiseSet(astronomy.Body.Moon, observer, direction, bounds.start, 2)?.date;
        const accepted = expected && expected >= bounds.start && expected < bounds.end ? expected : null;
        assert.equal(day[field]?.getTime() ?? null, accepted?.getTime() ?? null);
        if (day[field]) {
          assert.equal(localDateKey(day[field], location.timezone), date);
          assert.ok(day[field] >= bounds.start && day[field] < bounds.end);
          (field === "moonrise" ? dateRises : dateSets).add(+day[field]);
          counts[field] += 1;
        }
      }
      if (date === "2026-01-03") { rises.add(+day.moonrise); sets.add(+day.moonset); }
    }
    // Missing civil-day events are valid; every event that exists must change
    // across these dates, without requiring an event on an arbitrary quota.
    assert.equal(dateRises.size, counts.moonrise);
    assert.equal(dateSets.size, counts.moonset);
    assert.ok(dateRises.size >= 3 && dateSets.size >= 3, `${id}: date changes both events`);
  }
  assert.equal(rises.size, 6, "city changes Moonrise");
  assert.equal(sets.size, 6, "city changes Moonset");
});

test("Moonset-before-Moonrise and genuine missing rise/set are independent and safe to display", async () => {
  const ordinary = await calculatePanchangDay("2026-10-03", settings());
  assert.ok(ordinary.moonset < ordinary.moonrise);
  for (const [date, missing] of [["2026-01-10", "moonrise"], ["2026-01-25", "moonset"]]) {
    const day = await calculatePanchangDay(date, settings());
    assert.equal(day[missing], null);
    const label = missing === "moonrise" ? "Moonrise" : "Moonset";
    assert.equal(formatMoonEvent(day[missing], label, DELHI, date), `No ${label} on this local civil date`);
  }
  assert.match(formatMoonEvent(new Date(NaN), "Moonrise", DELHI, ordinary.date), /No Moonrise/);
  const high = moonEvents("2026-10-03", { ...DELHI, altitude: 3000 });
  assert.notEqual(+high.moonrise, +ordinary.moonrise, "elevation enters the observer model");
});

test("Moon civil boundaries respect IST midnight, DST and the location rather than the host timezone", async () => {
  const bounds = localDayBounds("2026-10-03", DELHI.timezone);
  assert.equal(bounds.start.toISOString(), "2026-10-02T18:30:00.000Z");
  assert.equal(bounds.end.toISOString(), "2026-10-03T18:30:00.000Z");
  const early = await calculatePanchangDay("2026-01-11", settings());
  assert.ok(early.moonrise < new Date("2026-01-11T00:00:00Z"), "early IST rise must not be lost by searching from UTC midnight");
  assert.equal(localDateKey(early.moonrise, DELHI.timezone), "2026-01-11");
  const ny = { name: "New York", latitude: 40.7128, longitude: -74.006, altitude: 10, timezone: "America/New_York" };
  for (const date of ["2026-03-08", "2026-11-01", "2026-12-31"]) {
    const events = moonEvents(date, ny);
    for (const field of ["moonrise", "moonset"]) if (events[field]) assert.equal(localDateKey(events[field], ny.timezone), date);
  }
  assert.equal(localDayBounds("2026-11-01", ny.timezone).end - localDayBounds("2026-11-01", ny.timezone).start, 25 * 3600000);
});

test("solar events, all four limb intervals and Muhurtas are exactly unchanged from the pre-Moon upgrade", async () => {
  const rows = [];
  for (const id of MOON_CITIES) for (const date of ["2026-01-15", "2026-07-15", "2026-10-03"]) {
    const d = await calculatePanchangDay(date, settings(city(id)));
    rows.push({ id, date, sunrise: d.sunrise, sunset: d.sunset, tithis: d.tithis,
      nakshatras: d.nakshatraTransitions, yogas: d.yogaTransitions, karanas: d.karanaTransitions, shubhMuhurtas: d.shubhMuhurtas });
  }
  // Captured before changing any calculation code; test-only regression checksum.
  assert.equal(createHash("sha256").update(JSON.stringify(rows)).digest("hex"), "3ba3e917731340e292131cfa527da65951e5084dd2a28165e836fceb281ee447");
});

test("USNO six-city independent civil-date rise/set references agree without tuned offsets", async () => {
  for (const reference of MOON_REFERENCES) {
    const location = city(reference.city);
    const day = await calculatePanchangDay(reference.date, settings(location));
    let maxSeconds = 0;
    for (const field of ["sunrise", "sunset", "moonrise", "moonset"]) {
      if (reference[field] === null) {
        assert.equal(day[field], null, `${reference.city} ${reference.date}: independent no-event reference`);
        continue;
      }
      const [hour, minute] = reference[field].split(":").map(Number);
      const expected = instantForLocalTime(reference.date, { hour, minute }, location.timezone);
      const difference = Math.abs(day[field] - expected) / 1000;
      maxSeconds = Math.max(maxSeconds, difference);
      assert.ok(day[field] && difference <= 90, `${reference.city} ${field}: ${difference.toFixed(1)} seconds`);
    }
    console.log(`MOON REFERENCE ${reference.city} ${reference.date}: largest rise/set difference ${maxSeconds.toFixed(1)} seconds`);
  }
});

test("monthly and daily Moon events agree and developer diagnostics stay explicit", async () => {
  for (const id of MOON_CITIES) {
    const monthly = await calculatePanchangMonth(2026, 1, settings(city(id)));
    clearPanchangCache();
    for (const date of ["2026-01-03", "2026-01-10", "2026-01-25"]) {
      const daily = await calculatePanchangDay(date, settings(city(id)));
      const item = monthly.find((day) => day.date === date);
      for (const field of ["moonrise", "moonset"]) assert.equal(daily[field]?.getTime() ?? null, item[field]?.getTime() ?? null);
    }
  }
  let printed;
  const day = await calculatePanchangDay("2026-10-03", settings());
  const row = printRiseSetValidation(day, (value) => { printed = value; });
  assert.equal(row, printed);
  assert.equal(row.timezone, "Asia/Kolkata");
  assert.equal(row.latitude, DELHI.latitude);
  assert.ok(row.sunrise && row.sunset && row.moonrise && row.moonset);
  if (process.env.PANCHANG_DEBUG_RISE_SET) printRiseSetValidation(day);
});

let passed = 0;
for (const { name, run } of tests) {
  await run();
  passed += 1;
  console.log(`PASS ${passed}: ${name}`);
}
console.log(`Panchang regression suite passed: ${passed}/${tests.length} groups`);
