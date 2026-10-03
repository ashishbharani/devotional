import { astronomy, lahiriAyanamsha } from "./panchang-engine.mjs";
import { localDateKey, localDayBounds } from "./date-time.mjs";

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

function riseSetEvents(body, dateKey, location, bounds) {
  const observer = new astronomy.Observer(Number(location.latitude), Number(location.longitude), Number(location.altitude || 0));
  const event = (direction) => {
    const value = astronomy.SearchRiseSet(body, observer, direction, bounds.start, 2)?.date;
    // SearchRiseSet finds the NEXT event, which may belong to tomorrow. The
    // civil window is half-open and independently checked in the chosen zone.
    return value && value >= bounds.start && value < bounds.end
      && localDateKey(value, location.timezone) === dateKey ? value : null;
  };
  return { rise: event(1), set: event(-1) };
}

export function solarEvents(dateKey, location, bounds) {
  const { rise, set } = riseSetEvents(astronomy.Body.Sun, dateKey, location, bounds);
  return { date: dateKey, sunrise: rise, sunset: set };
}

// Independent rise/set searches: Moonset is allowed to precede Moonrise.
// Observer altitude is elevation above sea level, not height above the ground.
// A two-day search covers even 25-hour DST civil days; only this date is accepted.
export function moonEvents(dateKey, location, bounds = localDayBounds(dateKey, location.timezone, location.timezoneOffset)) {
  const { rise, set } = riseSetEvents(astronomy.Body.Moon, dateKey, location, bounds);
  return { date: dateKey, moonrise: rise, moonset: set };
}
