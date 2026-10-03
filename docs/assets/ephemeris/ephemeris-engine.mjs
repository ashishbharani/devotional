// SPDX-License-Identifier: AGPL-3.0-or-later
import { createSwissEph } from "./vendor/swiss-0.2.2/dist/instance.js";
import { Body, Flag, Ayanamsa } from "./vendor/swiss-0.2.2/dist/constants.js";
import { classifyLongitude, ketuLongitude, motionForSpeed } from "./zodiac.mjs";
import { julianDayUT } from "./time-conversion.mjs";

export const AYANAMSHAS = Object.freeze({
  lahiri: { name: "Lahiri (Chitrapaksha)", mode: Ayanamsa.Lahiri },
  raman: { name: "Raman", mode: Ayanamsa.Raman },
  krishnamurti: { name: "Krishnamurti", mode: Ayanamsa.Krishnamurti },
  yukteshwar: { name: "Yukteshwar", mode: Ayanamsa.Yukteshwar },
  fagan: { name: "Fagan/Bradley", mode: Ayanamsa.FaganBradley },
  tropical: { name: "Tropical / Sayana", mode: null },
});
export const BODIES = [
  { id: Body.Sun, key: "sun", name: "Surya / Sun", hindi: "सूर्य", symbol: "☉" },
  { id: Body.Moon, key: "moon", name: "Chandra / Moon", hindi: "चन्द्र", symbol: "☽" },
  { id: Body.Mars, key: "mars", name: "Mangala / Mars", hindi: "मंगल", symbol: "♂" },
  { id: Body.Mercury, key: "mercury", name: "Budha / Mercury", hindi: "बुध", symbol: "☿" },
  { id: Body.Jupiter, key: "jupiter", name: "Guru / Jupiter", hindi: "गुरु", symbol: "♃" },
  { id: Body.Venus, key: "venus", name: "Shukra / Venus", hindi: "शुक्र", symbol: "♀" },
  { id: Body.Saturn, key: "saturn", name: "Shani / Saturn", hindi: "शनि", symbol: "♄" },
];
export const MODERN_BODIES = [
  { id: Body.Uranus, key: "uranus", name: "Uranus", symbol: "♅" },
  { id: Body.Neptune, key: "neptune", name: "Neptune", symbol: "♆" },
  { id: Body.Pluto, key: "pluto", name: "Pluto", symbol: "♇" },
];
export const DATA_FILES = [
  { file: "sepl_18.se1", sha256: "ca1393ceab3a44fbc895887cf789c68819ae6a1cbc9b22225872dbe4ccd99a66" },
  { file: "semo_18.se1", sha256: "1ca07bd67c24374d77226180c20a4f9996cba013697894810518e7eb582ca4f7" },
];

export async function verifyData(bytes, expected) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  const actual = [...new Uint8Array(digest)].map((v) => v.toString(16).padStart(2, "0")).join("");
  if (actual !== expected) throw new Error("Ephemeris dataset checksum mismatch. Please reload.");
}

export async function loadEphemerisEngine(readFile = async (file) => {
  const response = await fetch(new URL(`./vendor/data-0.2.2/${file}`, import.meta.url));
  if (!response.ok) throw new Error(`Ephemeris data unavailable: ${file}.`);
  return new Uint8Array(await response.arrayBuffer());
}) {
  const files = Object.fromEntries(await Promise.all(DATA_FILES.map(async ({ file, sha256 }) => {
    const bytes = await readFile(file);
    await verifyData(bytes, sha256);
    return [file, bytes];
  })));
  const engine = await createSwissEph({ files });
  if (engine.version !== "2.10.03") { engine.dispose(); throw new Error("Unexpected Swiss Ephemeris version."); }
  return engine;
}

export function validateSettings(settings) {
  if (!AYANAMSHAS[settings.ayanamsha]) throw new RangeError("Unknown ayanamsha.");
  if (!["mean", "true"].includes(settings.nodeMode)) throw new RangeError("Unknown lunar node mode.");
  if (!["geocentric", "topocentric"].includes(settings.observerMode)) throw new RangeError("Unknown observer mode.");
  if (settings.showLagna || settings.observerMode === "topocentric") {
    if (settings.latitude === null || settings.longitude === null || !Number.isFinite(settings.latitude) || Math.abs(settings.latitude) > 90
        || !Number.isFinite(settings.longitude) || Math.abs(settings.longitude) > 180) throw new RangeError("A location is required: latitude −90 to +90, longitude −180 to +180.");
    if (settings.showLagna && Math.abs(settings.latitude) === 90) throw new RangeError("Lagna is undefined at the geographic poles.");
    if (!Number.isFinite(settings.altitude)) throw new RangeError("Supply an elevation in metres for location-dependent calculations.");
  }
}

/** Single raw-number calculation used by current, civil-date and monthly views.
 * Synchronous calls are serialized in one worker, so mutable Swiss settings
 * cannot leak between concurrent requests. Nakshatras always use sidereal
 * longitude; tropical comparison deliberately leaves them absent.
 */
export function calculateEphemeris(engine, settings) {
  validateSettings(settings);
  const instant = new Date(settings.instantUTC);
  const jdUT = julianDayUT(instant);
  if (instant < new Date("1800-01-01T00:00:00Z") || instant >= new Date("2400-01-01T00:00:00Z")) throw new RangeError("UTC instant is outside the loaded 1800–2399 dataset.");
  const sidereal = settings.ayanamsha !== "tropical";
  const selection = AYANAMSHAS[settings.ayanamsha];
  engine.setSiderealMode(selection.mode ?? Ayanamsa.Lahiri);
  const observerFlags = settings.observerMode === "topocentric" ? Flag.Topocentric : 0;
  if (observerFlags) engine.setTopocentric(settings.longitude, settings.latitude, settings.altitude);
  const flags = observerFlags | (sidereal ? Flag.Sidereal : 0);
  const warning = [];
  const position = (body, node = false) => {
    // Lunar nodes are mathematical orbital intersections, not observable
    // bodies: Swiss keeps them geocentric. Explicitly report this convention.
    const bodyFlags = node ? flags & ~Flag.Topocentric : flags;
    const raw = engine.calc(jdUT, body.id, { flags: bodyFlags, ephemeris: "swiss" });
    if (raw.ephemeris !== "swiss") throw new Error(`Moshier fallback detected for ${body.name}. Results withheld; restore the Swiss data files.`);
    if (raw.warning) warning.push(raw.warning);
    const tropical = sidereal ? engine.calc(jdUT, body.id, { flags: node ? 0 : observerFlags }) : raw;
    if (tropical.ephemeris !== "swiss") throw new Error("Moshier fallback detected. Results withheld.");
    const result = { ...body, ...raw, ...classifyLongitude(raw.longitude), tropicalLongitude: tropical.longitude,
      speed: raw.longitudeSpeed, motion: motionForSpeed(raw.longitudeSpeed), observer: node ? "Geocentric orbital node" : settings.observerMode };
    if (!sidereal) Object.assign(result, { nakshatra: null, pada: null, nakshatraProgress: null });
    return result;
  };
  const planets = BODIES.map((body) => position(body));
  const rahu = position({ id: settings.nodeMode === "true" ? Body.TrueNode : Body.MeanNode, key: "rahu", name: "Rahu", hindi: "राहु", symbol: "☊" }, true);
  const ketu = { ...rahu, id: null, key: "ketu", name: "Ketu", hindi: "केतु", symbol: "☋", ...classifyLongitude(ketuLongitude(rahu.longitude)),
    tropicalLongitude: ketuLongitude(rahu.tropicalLongitude), latitude: -rahu.latitude,
    distance: null, latitudeSpeed: -rahu.latitudeSpeed, distanceSpeed: null };
  if (!sidereal) Object.assign(ketu, { nakshatra: null, pada: null, nakshatraProgress: null });
  planets.push(rahu, ketu);
  const modern = settings.modern ? MODERN_BODIES.map((body) => position(body)) : [];
  let lagna = null;
  let houses = null;
  if (settings.showLagna) {
    const system = settings.houseSystem || "W";
    if (!["W", "A", "S", "P"].includes(system)) throw new RangeError("Unknown house system.");
    const raw = engine.houses(jdUT, settings.latitude, settings.longitude, system, { flags: sidereal ? Flag.Sidereal : 0 });
    if (raw.substituted) throw new RangeError(`Selected house system unavailable at this latitude: ${raw.warning || "polar latitude"}`);
    lagna = { ...classifyLongitude(raw.ascendant), name: "Lagna / Ascendant" };
    if (!sidereal) Object.assign(lagna, { nakshatra: null, pada: null });
    houses = { system, cusps: system === "W" ? Array.from({ length: 12 }, (_, i) => ((lagna.rashiIndex + i) % 12) * 30) : raw.cusps };
  }
  return { instantUTC: instant.toISOString(), jdUT, ayanamsha: selection.name, ayanamshaKey: settings.ayanamsha,
    ayanamshaValue: sidereal ? engine.ayanamsa(jdUT) : 0, sidereal, planets, modern, lagna, houses,
    deltaTSeconds: engine.deltaT(jdUT) * 86400, engine: "Swiss Ephemeris", engineVersion: engine.version,
    wrapperVersion: "0.2.2", dataset: "DE441 • sepl_18.se1 + semo_18.se1 • data 0.2.2 (SHA-256 verified)",
    observerMode: settings.observerMode, nodeMode: settings.nodeMode, flags: Flag.SwissEphemeris | Flag.Speed | flags,
    warnings: [...new Set(warning)], settings: { ...settings },
    timeScaleNote: "UTC approximates UT1; no DUT1 bulletin applied. ΔT is the engine model (TT−UT)." };
}
