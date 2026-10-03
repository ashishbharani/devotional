import { limbAngle, normalize360 } from "./astronomy.mjs";
import { tithiNames, nakshatraNames, yogaNames } from "./panchang-engine.mjs";

const HOUR = 3600000;
const ROOT_PRECISION_MS = 250;
export const tithiIndex = (elongation) => Math.floor(normalize360(elongation) / 12);
const signedAngle = (angle) => normalize360(angle + 180) - 180;

// Bracket in 3-hour steps and bisect each actual longitude crossing. Angular
// residuals avoid the 0/360 discontinuity. Search horizon guards bad ephemerides,
// not the number of segments. Return the first instant on the new side.
export function boundary(instant, target, direction, angleAt) {
  const residual = (ms) => signedAngle(angleAt(new Date(ms)) - target);
  let edge = instant.getTime();
  let value = residual(edge);
  if (Math.abs(value) < 1e-10) return new Date(edge);
  for (let scanned = 0; scanned < 96 * HOUR; scanned += 3 * HOUR) {
    const other = edge + direction * 3 * HOUR;
    const nextValue = residual(other);
    if ((direction > 0 && value <= 0 && nextValue >= 0)
      || (direction < 0 && nextValue <= 0 && value >= 0)) {
      let low = Math.min(edge, other);
      let high = Math.max(edge, other);
      while (high - low > ROOT_PRECISION_MS) {
        const middle = Math.floor((low + high) / 2);
        if (residual(middle) < 0) low = middle;
        else high = middle;
      }
      return new Date(high);
    }
    edge = other;
    value = nextValue;
  }
  throw new Error("An astronomical limb boundary could not be bracketed.");
}

export function karanaName(index) {
  if (index === 0) return "Kimstughna";
  if (index >= 57) return ["Shakuni", "Chatushpada", "Naga"][index - 57];
  return ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"][(index - 1) % 7];
}

export function limbSegments(kind, sunrise, nextSunrise, previousSunrise, customAngle) {
  const width = kind === "tithi" ? 12 : kind === "karana" ? 6 : 360 / 27;
  const count = Math.round(360 / width);
  const angleAt = customAngle || ((date) => limbAngle(kind, date));
  const names = kind === "tithi" ? tithiNames : kind === "nakshatra" ? nakshatraNames : yogaNames;
  let index = Math.floor(normalize360(angleAt(sunrise)) / width);
  let start = boundary(sunrise, index * width, -1, angleAt);
  const segments = [];
  let cursor = sunrise;
  while (cursor < nextSunrise) {
    const end = boundary(cursor, normalize360((index + 1) * width), 1, angleAt);
    if (end <= cursor) throw new Error("Non-increasing astronomical boundary.");
    const presentAtSunrise = start <= sunrise && end > sunrise;
    const repeatedAtSunrise = presentAtSunrise && ((previousSunrise && start <= previousSunrise && end > previousSunrise) || end > nextSunrise);
    segments.push({
      index, number: index + 1,
      name: kind === "karana" ? karanaName(index) : names[index],
      ...(kind === "tithi" ? { paksha: index < 15 ? "Shukla" : "Krishna" } : {}),
      start, end, presentAtSunrise,
      skippedAtSunrise: !presentAtSunrise && start > sunrise && end <= nextSunrise,
      repeatedAtSunrise: Boolean(repeatedAtSunrise),
      withinDay: { start: new Date(Math.max(start, sunrise)), end: new Date(Math.min(end, nextSunrise)) },
      targetAngle: normalize360((index + 1) * width),
    });
    start = end;
    cursor = end;
    index = (index + 1) % count;
  }
  return segments;
}

export function nextTithi(segment) {
  const index = (segment.index + 1) % 30;
  const end = boundary(segment.end, normalize360((index + 1) * 12), 1, (date) => limbAngle("tithi", date));
  return { index, number: index + 1, name: tithiNames[index], paksha: index < 15 ? "Shukla" : "Krishna", start: segment.end, end };
}
