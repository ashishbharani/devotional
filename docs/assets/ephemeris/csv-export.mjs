// SPDX-License-Identifier: AGPL-3.0-or-later
const cell = (value) => {
  const text = String(value ?? "");
  // Stop spreadsheet formula evaluation in any textual metadata.
  const safe = /^[=+@\t\r]/.test(text) || /^-\D/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
};
export function exportCSV(rows, { generatedAt = new Date().toISOString(), referenceTime = "Selected instant" } = {}) {
  if (!rows.length) throw new RangeError("Calculate results before exporting.");
  const { result, civil } = rows[0];
  const metadata = [
    ["Indian Ephemeris", "Raw decimal degrees; speed degrees/day; distance AU"],
    ["Generated UTC", generatedAt], ["Calendar", "Proleptic Gregorian"],
    ["Timezone", civil.timezone], ["Manual historical offset", civil.manualOffset ?? "IANA resolved"],
    ["Ayanamsha", result.ayanamsha], ["Node", result.nodeMode], ["Observer", result.observerMode],
    ["Daily reference time", referenceTime], ["Engine", `${result.engine} ${result.engineVersion}`],
    ["Wrapper", "@kuntay/swisseph 0.2.2"], ["Dataset", result.dataset], ["Time scale", result.timeScaleNote],
    ["Node convention", "Geocentric orbital nodes; Ketu exactly opposite Rahu; node distance is not a physical distance"],
    ["Latitude", result.settings.latitude], ["Longitude east", result.settings.longitude], ["Elevation metres", result.settings.altitude],
    ["Lagna longitude degrees", result.lagna?.longitude], ["House system", result.houses?.system],
    ["House cusps degrees (1–12)", result.houses?.cusps.join("; ")],
  ];
  const columns = ["Local date", "Local time", "UTC", "UTC offset seconds", "JD UT", "Ayanamsha degrees", "Graha", "Symbol", "Longitude degrees", "Rashi", "Degree within Rashi", "Nakshatra", "Pada", "Nakshatra progress degrees", "Speed degrees/day", "Motion", "Ecliptic latitude degrees", "Distance AU", "Tropical longitude degrees", "Body observer"];
  const values = rows.flatMap(({ result: r, civil: c }) => [...r.planets, ...r.modern].map((p) => [
    c.date, c.time, r.instantUTC, c.offsetSeconds, r.jdUT, r.ayanamshaValue, p.name, p.symbol, p.longitude,
    p.rashi.name, p.degreeInRashi, p.nakshatra, p.pada, p.nakshatraProgress, p.speed, p.motion, p.latitude,
    ["rahu", "ketu"].includes(p.key) ? null : p.distance, p.tropicalLongitude, p.observer,
  ]));
  return [...metadata, [], columns, ...values].map((row) => row.map(cell).join(",")).join("\r\n");
}

export function downloadCSV(text, filename) {
  const url = URL.createObjectURL(new Blob(["\uFEFF", text], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
