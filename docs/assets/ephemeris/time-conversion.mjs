// SPDX-License-Identifier: AGPL-3.0-or-later
// One civil-time boundary. No host timezone, Date string guessing or fixed IST fallback.
const DAY_MS = 86400000;
export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export function parseCivil(date, time = "00:00:00") {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(time);
  if (!d || !t) throw new RangeError("Use Gregorian YYYY-MM-DD and HH:MM[:SS].");
  const [year, month, day] = d.slice(1).map(Number);
  const [hour, minute, second] = [Number(t[1]), Number(t[2]), Number(t[3] || 0)];
  const wall = Date.UTC(year, month - 1, day, hour, minute, second);
  const check = new Date(wall);
  if (year < 1800 || year > 2399 || check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1
      || check.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59) {
    throw new RangeError("Enter a valid Gregorian date from 1800–2399 and a valid time (no leap-second input).");
  }
  return { year, month, day, hour, minute, second, wall };
}

export function zonedParts(instant, timezone = DEFAULT_TIMEZONE) {
  const ms = new Date(instant).getTime();
  if (!Number.isFinite(ms)) throw new RangeError("Invalid UTC instant.");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(ms);
  const read = (key) => Number(parts.find((part) => part.type === key)?.value);
  const p = Object.fromEntries(["year", "month", "day", "hour", "minute", "second"].map((key) => [key, read(key)]));
  p.offsetSeconds = (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000) / 1000;
  p.date = `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
  p.time = [p.hour, p.minute, p.second].map((v) => String(v).padStart(2, "0")).join(":");
  return p;
}

export function parseOffset(value) {
  const m = /^([+-])(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value);
  if (!m || Number(m[2]) > 14 || Number(m[3]) > 59 || Number(m[4] || 0) > 59) throw new RangeError("Offset must be ±HH:MM[:SS], at most ±14:00.");
  const seconds = (Number(m[2]) * 3600 + Number(m[3]) * 60 + Number(m[4] || 0)) * (m[1] === "-" ? -1 : 1);
  if (Math.abs(seconds) > 50400) throw new RangeError("Offset must be at most ±14:00.");
  return seconds;
}

export function localCivilTimeToUTC({ date, time, timezone = DEFAULT_TIMEZONE, manualOffset = null }) {
  const civil = parseCivil(date, time);
  // Validate the IANA identifier even when the historical override is enabled.
  zonedParts(civil.wall, timezone);
  let ms;
  let offsetSeconds;
  if (manualOffset !== null) {
    offsetSeconds = parseOffset(manualOffset);
    ms = civil.wall - offsetSeconds * 1000;
  } else {
    // Collect both sides of any DST/historical transition, then require exactly
    // one UTC instant matching the entered clock. Gaps and folds are not guessed.
    const offsets = new Set();
    for (const delta of [-2, -1, 0, 1, 2]) offsets.add(zonedParts(civil.wall + delta * DAY_MS, timezone).offsetSeconds);
    const matches = [...offsets].map((offset) => ({ ms: civil.wall - offset * 1000, offset }))
      .filter((candidate) => {
        const p = zonedParts(candidate.ms, timezone);
        return ["year", "month", "day", "hour", "minute", "second"].every((key) => p[key] === civil[key]);
      });
    if (matches.length !== 1) throw new RangeError(matches.length ? "This local time is ambiguous. Specify the historical UTC offset explicitly." : "This local time does not exist in the selected timezone.");
    ms = matches[0].ms;
    offsetSeconds = matches[0].offset;
  }
  return { instantUTC: new Date(ms).toISOString(), date, time: `${String(civil.hour).padStart(2, "0")}:${String(civil.minute).padStart(2, "0")}:${String(civil.second).padStart(2, "0")}`,
    timezone, offsetSeconds, manualOffset, calendar: "Proleptic Gregorian",
    warning: civil.year < 1970 ? "Historical civil-time records may be uncertain. IANA history is browser-dependent; verify the regional time and use an explicit offset when needed." : null };
}

export function formatOffset(seconds) {
  const value = Math.abs(seconds);
  const fields = [Math.floor(value / 3600), Math.floor(value % 3600 / 60), Math.round(value % 60)].map((v) => String(v).padStart(2, "0"));
  return `UTC${seconds < 0 ? "−" : "+"}${fields[0]}:${fields[1]}${value % 60 ? `:${fields[2]}` : ""}`;
}

export function civilForInstant(instantUTC, timezone, manualOffset = null) {
  if (manualOffset === null) return zonedParts(instantUTC, timezone);
  const offsetSeconds = parseOffset(manualOffset);
  return { ...zonedParts(new Date(new Date(instantUTC).getTime() + offsetSeconds * 1000), "UTC"), offsetSeconds };
}

export function julianDayUT(instantUTC) {
  const ms = new Date(instantUTC).getTime();
  if (!Number.isFinite(ms)) throw new RangeError("Invalid UTC instant.");
  // UTC is used as the civil approximation to UT1. No DUT1 bulletin is bundled.
  return ms / DAY_MS + 2440587.5;
}

export function monthDates(year, month) {
  if (!Number.isInteger(year) || !Number.isInteger(month) || year < 1800 || year > 2399 || month < 1 || month > 12) throw new RangeError("Invalid month (1800–2399).");
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: days }, (_, i) => `${year}-${String(month).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`);
}
