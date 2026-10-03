// Developer-only diagnostic; never imported by the production UI.
import { calculatePanchangDay } from "../docs/assets/panchang/panchang-adapter.mjs";
import { INDIAN_CITIES } from "../docs/assets/panchang/settings.mjs";
import { parseDateKey } from "../docs/assets/panchang/date-time.mjs";

const date = process.argv[2] || "2026-10-03";
if (!parseDateKey(date)) throw new RangeError("Use YYYY-MM-DD.");
for (const id of ["delhi", "mumbai", "kolkata", "chennai", "bengaluru", "varanasi"]) {
  const location = INDIAN_CITIES.find((city) => city.id === id);
  const day = await calculatePanchangDay(date, { location, convention: "amanta" });
  const format = (value) => value ? new Intl.DateTimeFormat("en-IN", {
    timeZone: location.timezone, hour: "2-digit", minute: "2-digit", hour12: true,
  }).format(value) : "Not occurring on this date";
  console.log(JSON.stringify({ date, location: location.name, latitude: location.latitude,
    longitude: location.longitude, elevation: location.altitude, timezone: location.timezone,
    ...Object.fromEntries(["sunrise", "sunset", "moonrise", "moonset"].map((field) => [field, format(day[field])])),
  }));
}
