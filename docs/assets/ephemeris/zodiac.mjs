// SPDX-License-Identifier: AGPL-3.0-or-later
export const RASHIS = [
  ["Mesha", "मेष", "Aries", "Ms"], ["Vrishabha", "वृषभ", "Taurus", "Vr"],
  ["Mithuna", "मिथुन", "Gemini", "Mi"], ["Karka", "कर्क", "Cancer", "Ka"],
  ["Simha", "सिंह", "Leo", "Si"], ["Kanya", "कन्या", "Virgo", "Kn"],
  ["Tula", "तुला", "Libra", "Tu"], ["Vrischika", "वृश्चिक", "Scorpio", "Vk"],
  ["Dhanu", "धनु", "Sagittarius", "Dh"], ["Makara", "मकर", "Capricorn", "Ma"],
  ["Kumbha", "कुम्भ", "Aquarius", "Ku"], ["Meena", "मीन", "Pisces", "Me"],
].map(([name, hindi, english, abbreviation]) => ({ name, hindi, english, abbreviation }));
export const NAKSHATRAS = ["Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra", "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni", "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha", "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishtha", "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati"];

export function normalizeLongitude(value) {
  if (!Number.isFinite(value)) throw new RangeError("Longitude must be finite.");
  const n = value % 360;
  return n < 0 ? n + 360 : n === 0 ? 0 : n;
}
// Only snap a rational boundary within 8 floating-point ULPs, not an
// astronomical tolerance. Never round a displayed longitude for classification.
function boundaryFloor(value) {
  const nearest = Math.round(value);
  return Math.abs(value - nearest) <= Number.EPSILON * 8 * Math.max(1, Math.abs(value)) ? nearest : Math.floor(value);
}
export function classifyLongitude(value) {
  const longitude = normalizeLongitude(value);
  const rashiIndex = Math.min(11, boundaryFloor(longitude / 30));
  const padaIndex = Math.min(107, boundaryFloor(longitude * 3 / 10));
  const nakshatraIndex = Math.floor(padaIndex / 4);
  const nakshatraProgress = Math.max(0, longitude - nakshatraIndex * 40 / 3);
  return { longitude, rashiIndex, rashi: RASHIS[rashiIndex], degreeInRashi: Math.max(0, longitude - rashiIndex * 30),
    nakshatraIndex, nakshatra: NAKSHATRAS[nakshatraIndex], pada: padaIndex % 4 + 1, nakshatraProgress };
}
export function ketuLongitude(rahu) { return normalizeLongitude(rahu + 180); }
// 0.0001 degrees/day = 0.36 arcseconds/day; a display status, not a station root.
export const STATION_THRESHOLD = 0.0001;
export function motionForSpeed(speed) {
  if (!Number.isFinite(speed)) throw new RangeError("Speed must be finite.");
  return Math.abs(speed) < STATION_THRESHOLD ? "Near station" : speed < 0 ? "Retrograde ℞" : "Direct";
}

export function formatAngle(value, precision = "seconds", cycle = 360) {
  const units = precision === "degrees" ? 1 : precision === "minutes" ? 60 : 3600;
  // Truncate display units so 29°59′59.9″ never becomes a mismatched 30°
  // inside the previous sign. Internal precision is never changed.
  const total = Math.floor(normalizeLongitude(value) % cycle * units + 1e-9);
  const degrees = Math.floor(total / units);
  if (units === 1) return `${degrees}°`;
  const minutes = Math.floor(total % units / (units / 60));
  return `${degrees}°${String(minutes).padStart(2, "0")}′${units === 3600 ? `${String(total % 60).padStart(2, "0")}″` : ""}`;
}
