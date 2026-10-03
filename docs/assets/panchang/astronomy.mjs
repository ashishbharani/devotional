import { astronomy, lahiriAyanamsha } from "./panchang-engine.mjs";

export const normalize360 = (angle) => ((angle % 360) + 360) % 360;
export const julianDate = (instant) => instant.getTime() / 86400000 + 2440587.5;

// Geocentric ecliptic-of-date longitudes, matching the existing pinned engine.
// Tithi uses tropical separation; sidereal limbs subtract Lahiri exactly once.
export function longitudes(instant) {
  return {
    sun: astronomy.Ecliptic(astronomy.GeoVector(astronomy.Body.Sun, instant, true)).elon,
    moon: astronomy.Ecliptic(astronomy.GeoVector(astronomy.Body.Moon, instant, true)).elon,
    ayanamsha: lahiriAyanamsha(instant),
  };
}

export function limbAngle(kind, instant) {
  const { sun, moon, ayanamsha } = longitudes(instant);
  if (kind === "nakshatra") return normalize360(moon - ayanamsha);
  if (kind === "yoga") return normalize360(sun + moon - 2 * ayanamsha);
  return normalize360(moon - sun);
}

export function solarEvents(dateKey, location, bounds) {
  const observer = new astronomy.Observer(Number(location.latitude), Number(location.longitude), Number(location.altitude || 0));
  const event = (direction) => {
    const value = astronomy.SearchRiseSet(astronomy.Body.Sun, observer, direction, bounds.start, 2)?.date;
    return value && value >= bounds.start && value < bounds.end ? value : null;
  };
  return { date: dateKey, sunrise: event(1), sunset: event(-1) };
}
