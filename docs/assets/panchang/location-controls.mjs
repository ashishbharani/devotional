import { timezoneOffsetForInstant } from "./date-time.mjs";
import { findCity } from "./settings.mjs";

const cache = new Map();
let nextSearch = 0;
export const GEOLOCATION_OPTIONS = Object.freeze({ enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });

export function locationDescription(location) {
  const elevation = location.altitudeKnown === false ? "Elevation unknown; 0 m neutral calculation fallback. Enter elevation if known." : `Elevation ${location.altitude} m.`;
  const privacy = ["manual", "geolocation"].includes(location.source) ? "Shared in this page session only; not stored. Reload restores the saved city." : "Selected location is saved and shared across Panchang and Ephemeris.";
  return `${location.name} · ${location.latitude}°, ${location.longitude}° · ${location.timezone}. ${!location.source ? "Approximate city-centre preset. " : location.source === "search" ? "Geocoded place centre, not an exact birth location. " : ""}${elevation} ${Number.isFinite(location.accuracy) ? `Reported accuracy ±${Math.round(location.accuracy)} m. ` : ""}${privacy}`;
}

export function manualLocation({ latitude, longitude, altitude, timezone }) {
  if (latitude == null || longitude == null || String(latitude).trim() === "" || String(longitude).trim() === "") throw new Error("Enter both latitude and longitude.");
  const lat = Number(latitude), lon = Number(longitude);
  const known = altitude !== null && altitude !== undefined && String(altitude).trim() !== "";
  const height = known ? Number(altitude) : 0;
  if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lon) || Math.abs(lon) > 180) throw new Error("Latitude must be −90 to 90; longitude must be −180 to 180.");
  if (!Number.isFinite(height) || height < -500 || height > 10000) throw new Error("Elevation must be −500 to 10,000 metres, or blank if unknown.");
  let offset;
  try { new Intl.DateTimeFormat("en", { timeZone: timezone }); offset = timezoneOffsetForInstant(new Date(), timezone); }
  catch (_) { throw new Error("Enter a valid IANA timezone, such as Asia/Kolkata."); }
  return { id: "manual", name: "Manual location", latitude: lat, longitude: lon, altitude: height, altitudeKnown: known, timezone, timezoneOffset: offset || 0, source: "manual" };
}

export function locationFromPosition(coords, timezone) {
  // GeolocationCoordinates exposes WebIDL getters, not enumerable own fields.
  // Spreading it drops latitude/longitude in real browsers (plain mocks hid it).
  const value = manualLocation({ latitude: coords.latitude, longitude: coords.longitude, altitude: coords.altitude, timezone });
  return { ...value, id: "device", name: "Current location (session only)", source: "geolocation", ...(Number.isFinite(coords.accuracy) && coords.accuracy >= 0 ? { accuracy: coords.accuracy } : {}) };
}

export function geolocationError(error) {
  const reason = { 1: "Location permission was denied.", 2: "Your device could not determine its position.", 3: "The location request timed out." }[error?.code] || "Location access is unavailable in this browser.";
  return `${reason} Your previous location has been kept. Search for a city or enter coordinates manually.`;
}

export function searchResultLocation(result) {
  if (result?.address?.country_code !== "in") return null;
  if (result.lat == null || result.lon == null || String(result.lat).trim() === "" || String(result.lon).trim() === "") return null;
  const latitude = Number(result.lat), longitude = Number(result.lon);
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180 || !result.display_name) return null;
  return { id: `osm-${result.osm_type || "place"}-${result.osm_id || result.place_id}`, name: String(result.display_name), latitude, longitude, altitude: 0, altitudeKnown: false, timezone: "Asia/Kolkata", timezoneOffset: 330, source: "search" };
}

// Explicit submit only: Nominatim forbids client-side autocomplete. No network
// request is made on input, focus, page load or preset selection.
export function attachLocationControls({ root, input, geolocate, timezone, apply, manual }) {
  let sequence = 0, controller;
  const panel = document.createElement("div");
  panel.className = "abp-location-search";
  panel.innerHTML = '<button type="button" class="abp-btn" data-location-search>Search Indian locations</button><p role="status" aria-live="polite" data-location-message></p><ul data-location-results></ul><small>Search sends only the place name to the geocoding provider, not device coordinates. <a data-location-attribution href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap contributors</a></small>';
  input.closest("label").after(panel);
  const message = panel.querySelector("[data-location-message]");
  const results = panel.querySelector("ul");
  const cancel = () => { sequence++; controller?.abort(); results.replaceChildren(); };
  const edit = () => { cancel(); input.setCustomValidity(""); };
  input.addEventListener("input", edit);
  const editCoordinates = (event) => {
    if (["latitude", "longitude", "altitude", "timezone"].includes(event.target.name)
      || ["locationLatitude", "locationLongitude", "locationAltitude", "panchangTimezone"].some((key) => key in event.target.dataset)) cancel();
  };
  root.addEventListener("input", editCoordinates);
  panel.querySelector("button").addEventListener("click", async () => {
    cancel();
    const query = input.value.trim();
    const preset = findCity(query);
    if (preset) { apply(preset); message.textContent = locationDescription(preset); return; }
    if (query.length < 3) { message.textContent = "Enter at least 3 characters, then Search. Built-in presets also work offline."; return; }
    const run = sequence;
    controller = new AbortController();
    const signal = controller.signal;
    const requestController = controller;
    const timeout = setTimeout(() => requestController.abort(), 15000);
    message.textContent = "Searching India… Choose a result explicitly; your previous location remains active.";
    try {
      const config = await fetch(new URL("./location-search.json", import.meta.url), { signal }).then((response) => { if (!response.ok) throw new Error(); return response.json(); });
      const endpoint = new URL(config.endpoint);
      if (endpoint.protocol !== "https:") throw new Error();
      const key = endpoint.href + query.toLocaleLowerCase();
      let places = cache.get(key);
      if (!places) {
        // Serialize this document's requests, including rapid repeated submits.
        const wait = Math.max(650, nextSearch - Date.now());
        nextSearch = Date.now() + wait + 1100;
        await new Promise((resolve) => setTimeout(resolve, wait));
        if (signal.aborted || run !== sequence || !root.isConnected) return;
        for (const [name, value] of Object.entries({ q: query, format: "jsonv2", countrycodes: "in", addressdetails: "1", limit: "6" })) endpoint.searchParams.set(name, value);
        const response = await fetch(endpoint, { signal, referrerPolicy: "strict-origin-when-cross-origin" });
        if (response.status === 429) { nextSearch = Math.max(nextSearch, Date.now() + 10000); throw new Error("The search service is busy. Wait before trying again; presets and manual coordinates still work."); }
        if (!response.ok) throw new Error();
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error();
        places = data.slice(0, 6).map(searchResultLocation).filter(Boolean);
        if (places.length) { if (cache.size >= 50) cache.delete(cache.keys().next().value); cache.set(key, places); }
      }
      if (run !== sequence || !root.isConnected) return;
      const attribution = panel.querySelector("a");
      if (config.attribution) attribution.textContent = config.attribution;
      if (config.attributionUrl && new URL(config.attributionUrl).protocol === "https:") attribution.href = config.attributionUrl;
      for (const place of places) {
        const item = document.createElement("li"), button = document.createElement("button");
        button.type = "button"; button.className = "abp-btn"; button.textContent = place.name;
        button.addEventListener("click", () => { cancel(); apply(place); message.textContent = locationDescription(place); });
        item.append(button); results.append(item);
      }
      message.textContent = places.length ? "Choose the correct place below. No result is selected automatically." : "No Indian locations found. Add district/state to your search, choose a preset, or enter coordinates.";
    } catch (error) {
      if (run !== sequence || !root.isConnected) return;
      message.textContent = error.message?.startsWith("The search service is busy") ? error.message : "Search unavailable or timed out. Your previous location is unchanged. Use an offline preset or manual coordinates.";
    } finally { clearTimeout(timeout); }
  });
  const submitLocation = (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault(); event.stopPropagation();
    panel.querySelector("[data-location-search]").click();
  };
  input.addEventListener("keydown", submitLocation);
  geolocate?.addEventListener("click", () => {
    cancel();
    const run = sequence, zone = timezone();
    if (!window.isSecureContext || !navigator.geolocation) { message.textContent = "Location requires HTTPS and a browser with geolocation support. Your previous location has been kept."; return; }
    message.textContent = "Waiting for your location permission…";
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      if (run !== sequence || !root.isConnected) return;
      try { const place = locationFromPosition(coords, zone); apply(place); message.textContent = `${locationDescription(place)} Coordinates cannot determine a timezone; verify the retained timezone.`; }
      catch (error) { message.textContent = `${error.message} Your previous location has been kept.`; }
    }, (error) => { if (run === sequence && root.isConnected) message.textContent = geolocationError(error); }, GEOLOCATION_OPTIONS);
  });
  if (manual) {
    const button = document.createElement("button");
    button.type = "button"; button.className = "abp-btn"; button.dataset.locationManual = "";
    button.textContent = "Apply manual coordinates across site (session only)";
    button.addEventListener("click", () => {
      cancel();
      try { const place = manualLocation({ ...manual(), timezone: timezone() }); apply(place); message.textContent = locationDescription(place); }
      catch (error) { message.textContent = `${error.message} Your previous location has been kept.`; }
    });
    panel.append(button);
  }
  return { cancel, show: (location) => { message.textContent = locationDescription(location); }, dispose: () => { cancel(); input.removeEventListener("input", edit); input.removeEventListener("keydown", submitLocation); root.removeEventListener("input", editCoordinates); } };
}
