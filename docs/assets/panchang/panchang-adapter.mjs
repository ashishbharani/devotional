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
  isEventOnLocalCivilDate,
  isEventWithinHinduDay,
  localDateKey,
  parseDateKey,
  safeAstronomicalDate,
  shiftDateKey,
  timezoneOffsetForInstant,
} from "./date-time.mjs";
import { applyFestivalRules } from "./festival-rules.mjs";

const rawCache = new Map();
const dayCache = new Map();

function locationKey(location) {
  return [
    Number(location.latitude).toFixed(6),
    Number(location.longitude).toFixed(6),
    Number(location.altitude || 0).toFixed(1),
    location.timezone,
  ].join("|");
}

function cacheKey(dateKey, settings) {
  return `${dateKey}|${locationKey(settings.location)}|${settings.convention}`;
}

function validLocation(location) {
  return location
    && Number.isFinite(Number(location.latitude)) && Number(location.latitude) >= -90 && Number(location.latitude) <= 90
    && Number.isFinite(Number(location.longitude)) && Number(location.longitude) >= -180 && Number(location.longitude) <= 180
    && typeof location.timezone === "string" && location.timezone;
}

function engineCall(dateKey, settings, localTime = { hour: 12 }) {
  if (!parseDateKey(dateKey)) throw new RangeError(`Invalid Panchang date: ${dateKey}`);
  if (!validLocation(settings.location)) throw new RangeError("Invalid Panchang location.");
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

function civilEvent(raw, field, dateKey, settings, warnings) {
  const direct = safeAstronomicalDate(raw[field]);
  if (direct && isEventOnLocalCivilDate(direct, dateKey, settings.location.timezone)) return direct;

  // The pinned engine searches once from local midnight. Verify its returned
  // event rather than recalculate the entire Panchang at different clock times.
  // Next-day events are not events of the requested local civil date.
  if (field === "moonrise" || field === "moonset") {
    warnings.push(`No ${field === "moonrise" ? "Moonrise" : "Moonset"} occurs on this location-local civil date.`);
    return null;
  }

  warnings.push(`${field} was unavailable or outside the selected location-local civil date.`);
  return null;
}

function transitionList(items, sunrise, nextSunrise, fallbackNames) {
  if (!Array.isArray(items)) return [];
  return items.flatMap((item) => {
    const start = safeAstronomicalDate(item.startTime);
    const end = safeAstronomicalDate(item.endTime);
    if (!start || !end || end <= start || !isEventWithinHinduDay(start, sunrise, nextSunrise)) return [];
    return [{
      index: Number.isInteger(item.index) ? item.index : null,
      name: item.name || fallbackNames?.[item.index] || "Not available",
      start,
      end: end > nextSunrise ? new Date(nextSunrise) : end,
    }];
  });
}

function nameAt(names, index) {
  return names?.[index] || String(index ?? "Not available");
}

export async function calculatePanchangDay(dateKey, settings) {
  const key = cacheKey(dateKey, settings);
  if (dayCache.has(key)) return dayCache.get(key);
  const raw = rawForDate(dateKey, settings);
  const nextDateKey = shiftDateKey(dateKey, 1);
  const nextRaw = rawForDate(nextDateKey, settings);
  const warnings = [];
  const sunrise = civilEvent(raw, "sunrise", dateKey, settings, warnings);
  const sunset = civilEvent(raw, "sunset", dateKey, settings, warnings);
  const nextSunrise = safeAstronomicalDate(nextRaw.sunrise);
  if (!sunrise || !nextSunrise || nextSunrise <= sunrise) throw new Error(`Valid consecutive sunrises were not available for ${dateKey}.`);
  const moonrise = civilEvent(raw, "moonrise", dateKey, settings, warnings);
  const moonset = civilEvent(raw, "moonset", dateKey, settings, warnings);
  const rules = applyFestivalRules(raw.festivals, raw.tithi);
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
    sunriseTithi: { index: raw.tithi, name: nameAt(tithiNames, raw.tithi) },
    tithiTransitions: transitionList(raw.tithis, sunrise, nextSunrise, tithiNames),
    sunriseNakshatra: { index: raw.nakshatra, name: nameAt(nakshatraNames, raw.nakshatra) },
    nakshatraTransitions: transitionList(raw.nakshatras, sunrise, nextSunrise, nakshatraNames),
    sunriseYoga: { index: raw.yoga, name: nameAt(yogaNames, raw.yoga) },
    yogaTransitions: transitionList(raw.yogas, sunrise, nextSunrise, yogaNames),
    sunriseKarana: { name: raw.karana || "Not available" },
    karanaTransitions: transitionList(raw.karanas, sunrise, nextSunrise),
    paksha: raw.paksha || "Not available",
    masa: {
      index: raw.masa?.index,
      name: raw.masa?.name || masaNames?.[raw.masa?.index] || "Not available",
      isAdhika: Boolean(raw.masa?.isAdhika),
    },
    samvat: raw.samvat,
    rahuKalam: raw.rahuKalamStart && raw.rahuKalamEnd ? { start: raw.rahuKalamStart, end: raw.rahuKalamEnd } : null,
    yamaganda: raw.yamagandaKalam || null,
    gulika: raw.gulikaKalam || null,
    abhijitMuhurta: raw.abhijitMuhurta || null,
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
}

export const engineNames = Object.freeze({ masaNames, nakshatraNames, tithiNames, varaNames, yogaNames });
