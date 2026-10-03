// SPDX-License-Identifier: AGPL-3.0-or-later
import { localCivilTimeToUTC, monthDates } from "./time-conversion.mjs";
import { calculateEphemeris } from "./ephemeris-engine.mjs";

export function calculateMonth(engine, request, progress = () => {}) {
  const dates = monthDates(request.year, request.month);
  const rows = dates.map((date, index) => {
    const civil = localCivilTimeToUTC({ date, time: request.referenceTime, timezone: request.timezone, manualOffset: request.manualOffset });
    const result = calculateEphemeris(engine, { ...request.settings, instantUTC: civil.instantUTC });
    progress(index + 1, dates.length);
    return { date, civil, result };
  });
  return { rows, referenceTime: request.referenceTime, timezone: request.timezone, generatedAt: new Date().toISOString() };
}

// Optional event search: one-hour brackets followed by bisection to <= 1 second.
// Events use raw engine longitudes/speeds, never rounded daily table values.
// Extremely brief double crossings inside one hour may not be found; disclose
// this scan bound instead of promising an exhaustive transit calendar.
export function findMonthEvents(engine, request) {
  const dates = monthDates(request.year, request.month);
  const start = localCivilTimeToUTC({ date: dates[0], time: "00:00:00", timezone: request.timezone, manualOffset: request.manualOffset });
  const nextDate = new Date(Date.UTC(request.year, request.month, 1)).toISOString().slice(0, 10);
  // End of supported data range: no speculative extrapolation.
  if (nextDate.startsWith("2400")) throw new RangeError("Event search is unavailable for December 2399; daily samples remain supported.");
  const end = localCivilTimeToUTC({ date: nextDate, time: "00:00:00", timezone: request.timezone, manualOffset: request.manualOffset });
  const begin = new Date(start.instantUTC).getTime();
  const finish = new Date(end.instantUTC).getTime();
  const at = (ms) => calculateEphemeris(engine, { ...request.settings, showLagna: false, instantUTC: new Date(ms).toISOString() }).planets;
  const events = [];
  let left = begin;
  let previous = at(left);
  while (left < finish) {
    const right = Math.min(left + 3600000, finish);
    const current = at(right);
    for (let p = 0; p < previous.length; p += 1) {
      const a = previous[p];
      const b = current[p];
      for (const kind of ["rashiIndex", "speed"]) {
        const changed = kind === "speed" ? a.speed * b.speed < 0 : a.rashiIndex !== b.rashiIndex;
        if (!changed) continue;
        let lo = left;
        let hi = right;
        const initial = kind === "speed" ? Math.sign(a.speed) : a.rashiIndex;
        while (hi - lo > 1000) {
          const mid = (lo + hi) / 2;
          const value = at(mid)[p];
          const state = kind === "speed" ? Math.sign(value.speed) : value.rashiIndex;
          if (state === initial) lo = mid; else hi = mid;
        }
        if (hi >= finish) continue;
        const after = at(hi + 1000)[p];
        events.push({ instantUTC: new Date(hi).toISOString(), body: a.name,
          event: kind === "speed" ? `${after.speed < 0 ? "Retrograde" : "Direct"} station` : `Enters ${after.rashi.name} / ${after.rashi.english}` });
      }
    }
    previous = current;
    left = right;
  }
  return events.sort((a, b) => a.instantUTC.localeCompare(b.instantUTC));
}
