// Traditional variable-length Muhurtas: daylight and the preceding night each
// have 15 divisions. Brahma is the penultimate night division (existing rule),
// Abhijit the 8th daylight division, Vijaya the 11th daylight division.
// Godhuli uses the common sunset-centred one-ghati convention: 12 minutes
// before to 12 minutes after sunset. Unlike a fixed evening clock interval,
// this follows local sunset. Traditions differ; see PANCHANG.md.
export function calculateShubhMuhurtas(sunrise, sunset, previousSunset) {
  if (!(sunrise < sunset) || !(previousSunset < sunrise)) throw new Error("Solar intervals are unavailable for Muhurta calculation.");
  const division = (origin, duration, from, to) => ({
    start: new Date(+origin + duration * from / 15),
    end: new Date(+origin + duration * to / 15),
  });
  const daylight = sunset - sunrise;
  const night = sunrise - previousSunset;
  return {
    brahma: { name: "Brahma Muhurta", ...division(previousSunset, night, 13, 14) },
    abhijit: { name: "Abhijit Muhurta", ...division(sunrise, daylight, 7, 8) },
    vijaya: { name: "Vijaya Muhurta", ...division(sunrise, daylight, 10, 11) },
    godhuli: { name: "Godhuli Muhurta", start: new Date(+sunset - 12 * 60000), end: new Date(+sunset + 12 * 60000) },
  };
}
