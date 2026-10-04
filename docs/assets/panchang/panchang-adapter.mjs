import {
  calculatePanchangam,
  masaNames,
  nakshatraNames,
  tithiNames,
  varaNames,
  yogaNames,
} from "./panchang-engine.mjs";
import {
  daysInMonth,
  instantForLocalTime,
  localDateKey,
  localDayBounds,
  parseDateKey,
  shiftDateKey,
  timezoneOffsetForInstant,
} from "./date-time.mjs";
import { applyFestivalRules } from "./festival-rules.mjs";
import { solarEvents, moonEvents, longitudes, julianDate, normalize360 } from "./astronomy.mjs";
import { limbSegments, nextTithi } from "./tithi.mjs";
import { calculateShubhMuhurtas } from "./muhurta.mjs";

export const CALCULATION_VERSION = "sunrise-intervals-v3-moon-civil-lahiri-ae2.1.19";

const rawCache = new Map();
const dayCache = new Map();
const solarCache = new Map();

function locationKey(location) {
  return [
    Number(location.latitude).toFixed(6),
    Number(location.longitude).toFixed(6),
    Number(location.altitude || 0).toFixed(1),
    location.timezone,
  ].join("|");
}

function cacheKey(dateKey, settings) {
  return `${CALCULATION_VERSION}|${dateKey}|${locationKey(settings.location)}|${settings.convention}`;
}

function validLocation(location) {
  return location
    && Number.isFinite(Number(location.latitude)) && Number(location.latitude) >= -90 && Number(location.latitude) <= 90
    && Number.isFinite(Number(location.longitude)) && Number(location.longitude) >= -180 && Number(location.longitude) <= 180
    && typeof location.timezone === "string" && location.timezone
    && Number.isFinite(Number(location.altitude || 0));
}

function engineCall(dateKey, settings, localTime = { hour: 12 }) {
  if (!parseDateKey(dateKey)) throw new RangeError(`Invalid Panchang date: ${dateKey}`);
  if (!validLocation(settings.location)) throw new RangeError("Invalid Panchang location.");
  // Do not silently substitute a fixed offset for a corrupt saved IANA zone.
  new Intl.DateTimeFormat("en", { timeZone: settings.location.timezone });
  const fallback = Number(settings.location.timezoneOffset || 0);
  const instant = instantForLocalTime(dateKey, localTime, settings.location.timezone, fallback);
  const offset = timezoneOffsetForInstant(instant, settings.location.timezone, fallback);
  return calculatePanchangam(
    instant,
    Number(settings.location.latitude),
    Number(settings.location.longitude),
    Number(settings.location.altitude || 0),
    { timezoneOffset: offset, calendarType: settings.convention },
  );
}

function rawForDate(dateKey, settings) {
  const key = cacheKey(dateKey, settings);
  if (!rawCache.has(key)) rawCache.set(key, engineCall(dateKey, settings));
  return rawCache.get(key);
}

function solarForDate(dateKey, settings) {
  const key = cacheKey(dateKey, settings);
  if (!solarCache.has(key)) {
    const bounds = localDayBounds(dateKey, settings.location.timezone, settings.location.timezoneOffset);
    solarCache.set(key, solarEvents(dateKey, settings.location, bounds));
  }
  return solarCache.get(key);
}

function nameAt(names, index) {
  return names?.[index] || String(index ?? "Not available");
}

export async function calculatePanchangDay(dateKey, settings) {
  const key = cacheKey(dateKey, settings);
  if (dayCache.has(key)) return dayCache.get(key);
  const raw = rawForDate(dateKey, settings);
  const nextDateKey = shiftDateKey(dateKey, 1);
  const warnings = [];
  const { sunrise, sunset } = solarForDate(dateKey, settings);
  const { sunrise: nextSunrise } = solarForDate(nextDateKey, settings);
  const { sunrise: previousSunrise, sunset: previousSunset } = solarForDate(shiftDateKey(dateKey, -1), settings);
  if (!sunrise || !nextSunrise || nextSunrise <= sunrise) throw new Error(`Valid consecutive sunrises were not available for ${dateKey}.`);
  if (!sunset || !previousSunset) throw new Error("Sunset is unavailable for this location/date.");
  const tithis = limbSegments("tithi", sunrise, nextSunrise, previousSunrise);
  const nakshatras = limbSegments("nakshatra", sunrise, nextSunrise, previousSunrise);
  const yogas = limbSegments("yoga", sunrise, nextSunrise, previousSunrise);
  const karanas = limbSegments("karana", sunrise, nextSunrise, previousSunrise);
  const shubhMuhurtas = calculateShubhMuhurtas(sunrise, sunset, previousSunset);
  // Calculate once for the selected civil date. Daily/monthly/home renderers
  // consume these same cached values; no whole-Panchanga fallback probes.
  const { moonrise, moonset } = moonEvents(dateKey, settings.location);
  if (!moonrise) warnings.push("No Moonrise occurs on this location-local civil date.");
  if (!moonset) warnings.push("No Moonset occurs on this location-local civil date.");
  const rules = applyFestivalRules(raw.festivals, tithis[0].index);
  const parts = parseDateKey(dateKey);
  const weekdayIndex = new Date(Date.UTC(parts.year, parts.month - 1, parts.day)).getUTCDay();
  const eighth = (part) => ({ start: new Date(+sunrise + (sunset - sunrise) * (part - 1) / 8), end: new Date(+sunrise + (sunset - sunrise) * part / 8) });
  const day = {
    date: dateKey,
    location: { ...settings.location },
    timezone: settings.location.timezone,
    weekday: nameAt(varaNames, raw.vara),
    locationDate: localDateKey(sunrise, settings.location.timezone),
    timezoneOffset: timezoneOffsetForInstant(sunrise, settings.location.timezone, settings.location.timezoneOffset),
    sunrise,
    sunset,
    nextSunrise,
    moonrise,
    moonset,
    panchangaDay: { start: sunrise, end: nextSunrise },
    sunriseTithi: tithis[0],
    tithiAtSunrise: tithis[0],
    tithis,
    tithiSegments: tithis,
    tithiTransitions: tithis,
    nextTithi: tithis[1] || nextTithi(tithis[0]),
    sunriseNakshatra: nakshatras[0],
    nakshatraTransitions: nakshatras,
    sunriseYoga: yogas[0],
    yogaTransitions: yogas,
    sunriseKarana: karanas[0],
    karanaTransitions: karanas,
    paksha: tithis[0].paksha,
    masa: {
      index: raw.masa?.index,
      name: raw.masa?.name || masaNames?.[raw.masa?.index] || "Not available",
      isAdhika: Boolean(raw.masa?.isAdhika),
    },
    samvat: raw.samvat,
    rahuKalam: eighth([8, 2, 7, 5, 6, 4, 3][weekdayIndex]),
    yamaganda: eighth([5, 4, 3, 2, 1, 7, 6][weekdayIndex]),
    gulika: eighth([7, 6, 5, 4, 3, 2, 1][weekdayIndex]),
    abhijitMuhurta: shubhMuhurtas.abhijit,
    shubhMuhurtas,
    calculation: { version: CALCULATION_VERSION, astronomy: "Astronomy Engine 2.1.19", ayanamsha: "Lahiri", solarConvention: "apparent upper limb, standard atmospheric refraction, observer altitude; level horizon", rootPrecisionSeconds: 0.25 },
    festivals: rules.festivals,
    observances: rules.observances,
    warnings,
    raw,
  };
  dayCache.set(key, day);
  return day;
}

export async function calculatePanchangMonth(year, month, settings, onProgress) {
  const total = daysInMonth(year, month);
  const days = [];
  for (let day = 1; day <= total; day += 1) {
    const dateKey = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    try {
      days.push(await calculatePanchangDay(dateKey, settings));
    } catch (error) {
      days.push({ date: dateKey, warnings: [error.message], error });
    }
    onProgress?.(day, total);
    if (day % 7 === 0) await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return days;
}

export function clearPanchangCache() {
  rawCache.clear();
  dayCache.clear();
  solarCache.clear();
}

// Opt-in diagnostics; called only by developers, never rendered in the UI.
export function inspectPanchang(day) {
  const { sun, moon, ayanamsha } = longitudes(day.sunrise);
  return { ...day.calculation, sunrise: day.sunrise, sunset: day.sunset, timezone: day.location.timezone,
    localTimestamp: new Intl.DateTimeFormat("en-IN", { timeZone: day.location.timezone, dateStyle: "full", timeStyle: "long" }).format(day.sunrise),
    utcJulianDate: julianDate(day.sunrise), sunLongitude: sun, moonLongitude: moon, ayanamsha,
    elongation: normalize360(moon - sun), tithiIndex: day.sunriseTithi.index,
    transitions: day.tithis.map((item) => ({ targetAngle: item.targetAngle, utcJulianDate: julianDate(item.end), instant: item.end })) };
}

// Explicit developer-only invocation; never called by a production renderer.
export function printRiseSetValidation(day, log = console.table) {
  const time = (instant) => instant ? new Intl.DateTimeFormat("en-GB", {
    timeZone: day.location.timezone, dateStyle: "short", timeStyle: "long",
  }).format(instant) : "No event on this local civil date";
  const row = { date: day.date, location: day.location.name,
    latitude: day.location.latitude, longitude: day.location.longitude,
    elevation: day.location.altitude || 0, timezone: day.location.timezone,
    sunrise: time(day.sunrise), sunset: time(day.sunset),
    moonrise: time(day.moonrise), moonset: time(day.moonset) };
  log(row);
  return row;
}

export const engineNames = Object.freeze({ masaNames, nakshatraNames, tithiNames, varaNames, yogaNames });
