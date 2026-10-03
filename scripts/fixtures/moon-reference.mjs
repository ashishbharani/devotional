// Development-only observations from the documented public USNO one-day API,
// retrieved 2026-10-03. Minute-resolution local civil times, tz=5.5, no DST.
// Production never imports or fetches this fixture. USNO uses a level horizon;
// its service has no observer-elevation input, unlike our selected-city model.
export const MOON_REFERENCES = [
  { city: "delhi", date: "2026-10-03", latitude: 28.6139, longitude: 77.209, sunrise: "06:15", sunset: "18:05", moonrise: "23:27", moonset: "13:09" },
  { city: "delhi", date: "2026-01-10", latitude: 28.6139, longitude: 77.209, sunrise: "07:15", sunset: "17:42", moonrise: null, moonset: "11:35" },
  { city: "delhi", date: "2026-01-25", latitude: 28.6139, longitude: 77.209, sunrise: "07:13", sunset: "17:55", moonrise: "10:55", moonset: null },
  { city: "mumbai", date: "2026-01-15", latitude: 19.076, longitude: 72.8777, sunrise: "07:15", sunset: "18:21", moonrise: "04:19", moonset: "15:18" },
  { city: "kolkata", date: "2026-05-17", latitude: 22.5726, longitude: 88.3639, sunrise: "04:56", sunset: "18:10", moonrise: "04:53", moonset: "19:00" },
  { city: "chennai", date: "2026-07-15", latitude: 13.0827, longitude: 80.2707, sunrise: "05:50", sunset: "18:40", moonrise: "06:34", moonset: "19:44" },
  { city: "bengaluru", date: "2026-06-15", latitude: 12.9716, longitude: 77.5946, sunrise: "05:54", sunset: "18:47", moonrise: "05:45", moonset: "19:16" },
  { city: "varanasi", date: "2026-02-15", latitude: 25.3176, longitude: 82.9739, sunrise: "06:33", sunset: "17:52", moonrise: "05:05", moonset: "15:51" },
].map((row) => ({ ...row, source: `https://aa.usno.navy.mil/api/rstt/oneday?date=${row.date}&coords=${row.latitude},${row.longitude}&tz=5.5` }));
