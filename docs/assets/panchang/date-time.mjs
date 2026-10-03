const DATE_KEY = /^(\d{4})-(\d{2})-(\d{2})$/;
const MINUTE_MS = 60_000;

function formatter(timeZone, options) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, ...options });
}

function partNumber(parts, type) {
  const value = Number(parts.find((part) => part.type === type)?.value);
  return Number.isFinite(value) ? value : null;
}

export function parseDateKey(value) {
  const match = DATE_KEY.exec(String(value || ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (
    check.getUTCFullYear() !== year
    || check.getUTCMonth() !== month - 1
    || check.getUTCDate() !== day
  ) return null;
  return { year, month, day };
}

export function dateKeyFromParts({ year, month, day }) {
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function shiftDateKey(value, days) {
  const parts = parseDateKey(value);
  if (!parts || !Number.isInteger(days)) throw new TypeError(`Invalid date shift: ${value}`);
  const shifted = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + days));
  return dateKeyFromParts({
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
  });
}

export function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function safeAstronomicalDate(value) {
  if (value === null || value === undefined) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function localDateParts(value, timeZone) {
  const date = safeAstronomicalDate(value);
  if (!date) throw new TypeError("A valid astronomical instant is required.");
  const parts = formatter(timeZone, {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const result = {
    year: partNumber(parts, "year"),
    month: partNumber(parts, "month"),
    day: partNumber(parts, "day"),
    hour: partNumber(parts, "hour"),
    minute: partNumber(parts, "minute"),
    second: partNumber(parts, "second"),
  };
  if (Object.values(result).some((part) => part === null)) throw new RangeError(`Unable to resolve time zone ${timeZone}.`);
  return result;
}

export function localDateKey(value, timeZone) {
  return dateKeyFromParts(localDateParts(value, timeZone));
}

export function timezoneOffsetForInstant(value, timeZone, fallbackMinutes = 0) {
  const date = safeAstronomicalDate(value);
  if (!date) throw new TypeError("A valid instant is required for a time-zone offset.");
  try {
    const parts = localDateParts(date, timeZone);
    const wallClockAsUtc = Date.UTC(
      parts.year, parts.month - 1, parts.day,
      parts.hour, parts.minute, parts.second,
    );
    return Math.round((wallClockAsUtc - date.getTime()) / MINUTE_MS);
  } catch (_) {
    if (!Number.isFinite(fallbackMinutes)) throw _;
    return fallbackMinutes;
  }
}

export function instantForLocalTime(dateKey, time, timeZone, fallbackMinutes = 0) {
  const parts = parseDateKey(dateKey);
  if (!parts) throw new RangeError(`Invalid civil date: ${dateKey}`);
  const hour = Number(time?.hour ?? 0);
  const minute = Number(time?.minute ?? 0);
  const second = Number(time?.second ?? 0);
  if (![hour, minute, second].every(Number.isInteger) || hour < 0 || hour > 23 || minute < 0 || minute > 59 || second < 0 || second > 59) {
    throw new RangeError("Invalid local civil time.");
  }
  const wallClockAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, second);
  let guess = new Date(wallClockAsUtc - fallbackMinutes * MINUTE_MS);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const offset = timezoneOffsetForInstant(guess, timeZone, fallbackMinutes);
    const next = new Date(wallClockAsUtc - offset * MINUTE_MS);
    if (next.getTime() === guess.getTime()) break;
    guess = next;
  }
  const resolved = localDateParts(guess, timeZone);
  if (
    resolved.year !== parts.year || resolved.month !== parts.month || resolved.day !== parts.day
    || resolved.hour !== hour || resolved.minute !== minute || resolved.second !== second
  ) throw new RangeError(`Local time ${dateKey} ${hour}:${minute}:${second} does not exist in ${timeZone}.`);
  return guess;
}

export function localDayBounds(dateKey, timeZone, fallbackMinutes = 0) {
  return {
    start: instantForLocalTime(dateKey, { hour: 0 }, timeZone, fallbackMinutes),
    end: instantForLocalTime(shiftDateKey(dateKey, 1), { hour: 0 }, timeZone, fallbackMinutes),
  };
}

export function isEventOnLocalCivilDate(value, dateKey, timeZone) {
  const date = safeAstronomicalDate(value);
  return Boolean(date) && localDateKey(date, timeZone) === dateKey;
}

export function isEventWithinHinduDay(value, sunrise, nextSunrise) {
  const event = safeAstronomicalDate(value);
  const start = safeAstronomicalDate(sunrise);
  const end = safeAstronomicalDate(nextSunrise);
  return Boolean(event && start && end && event >= start && event < end);
}
