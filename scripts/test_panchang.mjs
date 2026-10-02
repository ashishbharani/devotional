import assert from "node:assert/strict";
import {
  calculatePanchangam,
  masaNames,
  nakshatraNames,
  tithiNames,
  varaNames,
  yogaNames,
} from "../docs/assets/panchang/panchang-engine.mjs";

const DELHI = Object.freeze({ latitude: 28.6139, longitude: 77.209, altitude: 216 });
const options = (calendarType) => ({ timezoneOffset: 330, calendarType });
const instant = (isoDate) => new Date(`${isoDate}T06:30:00.000Z`);
const calculate = (isoDate, calendarType = "amanta") => calculatePanchangam(
  instant(isoDate), DELHI.latitude, DELHI.longitude, DELHI.altitude, options(calendarType),
);

for (const date of ["2024-02-29", "2026-10-02", "2026-12-31", "2027-01-01"]) {
  const value = calculate(date);
  assert.ok(value.tithi >= 0 && value.tithi < 30, `${date}: valid Tithi`);
  assert.ok(value.nakshatra >= 0 && value.nakshatra < 27, `${date}: valid Nakshatra`);
  assert.ok(value.sunrise instanceof Date && value.sunset instanceof Date, `${date}: rise/set available`);
  assert.ok(value.sunrise < value.sunset, `${date}: sunrise precedes sunset`);
  assert.ok(tithiNames[value.tithi], `${date}: named Tithi`);
  assert.ok(nakshatraNames[value.nakshatra], `${date}: named Nakshatra`);
  assert.ok(yogaNames[value.yoga], `${date}: named Yoga`);
  assert.ok(varaNames[value.vara], `${date}: named Vara`);
  assert.ok(masaNames[value.masa.index], `${date}: named Masa`);
}

const reference = calculate("2026-10-02");
assert.equal(tithiNames[reference.tithi], "Shashthi");
assert.equal(reference.paksha, "Krishna");
assert.equal(reference.masa.name, "Bhadrapada");
assert.equal(nakshatraNames[reference.nakshatra], "Mrigashira");
assert.equal(varaNames[reference.vara], "Friday");
assert.equal(reference.samvat.vikram, 2083);
assert.equal(reference.samvat.shaka, 1948);
assert.equal(calculate("2026-10-02", "purnimanta").masa.name, "Ashwina");
assert.ok(reference.tithiEndTime instanceof Date);
assert.ok(reference.nakshatraEndTime instanceof Date);

const amanta = calculate("2026-10-02", "amanta");
const purnimanta = calculate("2026-10-02", "purnimanta");
assert.equal(amanta.tithi, purnimanta.tithi, "calendar convention does not alter astronomy");
assert.equal(amanta.nakshatra, purnimanta.nakshatra, "calendar convention does not alter Nakshatra");
assert.notEqual(amanta.masa.name, purnimanta.masa.name, "Amanta and Purnimanta month naming differs when expected");

const transition = calculate("2026-10-02");
assert.ok(transition.tithis.length >= 1, "daily Tithi transitions available");
assert.ok(transition.nakshatras.length >= 1, "daily Nakshatra transitions available");
assert.ok(transition.rahuKalamStart < transition.rahuKalamEnd, "Rahu Kalam interval is ordered");

console.log("Panchang engine tests passed: leap day, year rollover, transitions, Delhi reference and both calendar conventions");
