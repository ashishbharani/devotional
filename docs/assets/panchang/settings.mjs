export const DEFAULT_LOCATION = Object.freeze({
  id: "delhi",
  name: "Delhi, India",
  latitude: 28.6139,
  longitude: 77.209,
  altitude: 216,
  timezone: "Asia/Kolkata",
  timezoneOffset: 330,
});

export const INDIAN_CITIES = Object.freeze([
  DEFAULT_LOCATION,
  { id: "ahmedabad", name: "Ahmedabad, Gujarat", latitude: 23.0225, longitude: 72.5714, altitude: 53, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "amritsar", name: "Amritsar, Punjab", latitude: 31.634, longitude: 74.8723, altitude: 234, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "bengaluru", name: "Bengaluru, Karnataka", latitude: 12.9716, longitude: 77.5946, altitude: 920, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "bhopal", name: "Bhopal, Madhya Pradesh", latitude: 23.2599, longitude: 77.4126, altitude: 527, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "bhubaneswar", name: "Bhubaneswar, Odisha", latitude: 20.2961, longitude: 85.8245, altitude: 45, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "chandigarh", name: "Chandigarh", latitude: 30.7333, longitude: 76.7794, altitude: 321, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "chennai", name: "Chennai, Tamil Nadu", latitude: 13.0827, longitude: 80.2707, altitude: 7, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "coimbatore", name: "Coimbatore, Tamil Nadu", latitude: 11.0168, longitude: 76.9558, altitude: 411, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "dehradun", name: "Dehradun, Uttarakhand", latitude: 30.3165, longitude: 78.0322, altitude: 640, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "guwahati", name: "Guwahati, Assam", latitude: 26.1445, longitude: 91.7362, altitude: 55, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "hyderabad", name: "Hyderabad, Telangana", latitude: 17.385, longitude: 78.4867, altitude: 505, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "indore", name: "Indore, Madhya Pradesh", latitude: 22.7196, longitude: 75.8577, altitude: 553, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "jaipur", name: "Jaipur, Rajasthan", latitude: 26.9124, longitude: 75.7873, altitude: 431, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "jammu", name: "Jammu, Jammu and Kashmir", latitude: 32.7266, longitude: 74.857, altitude: 327, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "kochi", name: "Kochi, Kerala", latitude: 9.9312, longitude: 76.2673, altitude: 3, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "kolkata", name: "Kolkata, West Bengal", latitude: 22.5726, longitude: 88.3639, altitude: 9, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "lucknow", name: "Lucknow, Uttar Pradesh", latitude: 26.8467, longitude: 80.9462, altitude: 123, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "madurai", name: "Madurai, Tamil Nadu", latitude: 9.9252, longitude: 78.1198, altitude: 101, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "mumbai", name: "Mumbai, Maharashtra", latitude: 19.076, longitude: 72.8777, altitude: 14, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "nagpur", name: "Nagpur, Maharashtra", latitude: 21.1458, longitude: 79.0882, altitude: 310, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "nashik", name: "Nashik, Maharashtra", latitude: 19.9975, longitude: 73.7898, altitude: 584, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "patna", name: "Patna, Bihar", latitude: 25.5941, longitude: 85.1376, altitude: 53, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "pune", name: "Pune, Maharashtra", latitude: 18.5204, longitude: 73.8567, altitude: 560, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "puri", name: "Puri, Odisha", latitude: 19.8135, longitude: 85.8312, altitude: 0, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "ranchi", name: "Ranchi, Jharkhand", latitude: 23.3441, longitude: 85.3096, altitude: 651, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "shimla", name: "Shimla, Himachal Pradesh", latitude: 31.1048, longitude: 77.1734, altitude: 2276, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "srinagar", name: "Srinagar, Jammu and Kashmir", latitude: 34.0837, longitude: 74.7973, altitude: 1585, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "thiruvananthapuram", name: "Thiruvananthapuram, Kerala", latitude: 8.5241, longitude: 76.9366, altitude: 16, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "varanasi", name: "Varanasi, Uttar Pradesh", latitude: 25.3176, longitude: 82.9739, altitude: 81, timezone: "Asia/Kolkata", timezoneOffset: 330 },
  { id: "visakhapatnam", name: "Visakhapatnam, Andhra Pradesh", latitude: 17.6868, longitude: 83.2185, altitude: 45, timezone: "Asia/Kolkata", timezoneOffset: 330 },
]);

const STORAGE_KEY = "abp-panchang-settings-v1";

export function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved?.location && Number.isFinite(saved.location.latitude) && Number.isFinite(saved.location.longitude)) {
      return { location: saved.location, convention: saved.convention === "purnimanta" ? "purnimanta" : "amanta" };
    }
  } catch (_) {
    // A blocked or malformed localStorage entry must never stop the page.
  }
  return { location: { ...DEFAULT_LOCATION }, convention: "amanta" };
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (_) {
    // Preferences simply remain session-only when storage is unavailable.
  }
}

export function findCity(value) {
  const needle = String(value || "").trim().toLocaleLowerCase();
  return INDIAN_CITIES.find((city) => city.name.toLocaleLowerCase() === needle || city.id === needle) || null;
}

