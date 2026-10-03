// Small independent validation set transcribed on 2026-10-03 from the linked
// Drik Panchang day pages. Times are local Asia/Kolkata civil times. This file
// intentionally contains only a few reference rows; it is not a copied calendar.
export const GOLDEN_DAYS = Object.freeze([
  {
    city: "Delhi",
    source: "https://www.drikpanchang.com/panchang/day-panchang.html?geoname-id=2170078",
    date: "2026-10-02",
    location: { name: "Delhi, India", latitude: 28.6139, longitude: 77.209, altitude: 216, timezone: "Asia/Kolkata", timezoneOffset: 330 },
    expected: { sunrise: "06:14", sunset: "18:06", moonrise: "22:25", moonset: "12:03", tithi: "Shashthi", tithiEnd: "10:15", nakshatra: "Mrigashira", nakshatraEnd: "02:55", paksha: "Krishna", masa: "Bhadrapada" },
  },
  {
    city: "Mumbai",
    source: "https://www.drikpanchang.com/marathi/panchang/marathi-day-panchang.html?geoname-id=1275339",
    date: "2026-10-02",
    location: { name: "Mumbai, Maharashtra", latitude: 19.076, longitude: 72.8777, altitude: 14, timezone: "Asia/Kolkata", timezoneOffset: 330 },
    expected: { sunrise: "06:29", sunset: "18:26", moonrise: "23:09", moonset: "11:56", tithi: "Shashthi", tithiEnd: "10:15", nakshatra: "Mrigashira", nakshatraEnd: "02:55", paksha: "Krishna", masa: "Bhadrapada" },
  },
  {
    city: "Chennai",
    source: "https://www.drikpanchang.com/panchang/day-panchang.html?geoname-id=1264527",
    date: "2026-10-02",
    location: { name: "Chennai, Tamil Nadu", latitude: 13.0827, longitude: 80.2707, altitude: 7, timezone: "Asia/Kolkata", timezoneOffset: 330 },
    expected: { sunrise: "05:58", sunset: "17:58", moonrise: "22:53", moonset: "11:11", tithi: "Shashthi", tithiEnd: "10:15", nakshatra: "Mrigashira", nakshatraEnd: "02:55", paksha: "Krishna", masa: "Bhadrapada" },
  },
  {
    city: "Guwahati",
    source: "https://www.drikpanchang.com/panchang/day-panchang.html?geoname-id=1261186",
    date: "2026-10-02",
    location: { name: "Guwahati, Assam", latitude: 26.1445, longitude: 91.7362, altitude: 55, timezone: "Asia/Kolkata", timezoneOffset: 330 },
    expected: { sunrise: "05:16", sunset: "17:09", moonrise: "21:32", moonset: "10:56", tithi: "Shashthi", tithiEnd: "10:15", nakshatra: "Mrigashira", nakshatraEnd: "02:55", paksha: "Krishna", masa: "Bhadrapada" },
  },
]);

export const GOLDEN_TOLERANCE_MINUTES = Object.freeze({
  sunrise: 2,
  sunset: 2,
  moonrise: 7,
  moonset: 7,
  tithiEnd: 2,
  nakshatraEnd: 2,
});
