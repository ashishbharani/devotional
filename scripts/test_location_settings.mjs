import assert from "node:assert/strict";
import { DEFAULT_LOCATION, STORAGE_KEY, loadSettings, loadSavedSettings, saveSettings, subscribeSettings, findCity, searchLocalPlaces } from "../docs/assets/panchang/settings.mjs";

const previousWindow = globalThis.window;
const previousStorage = globalThis.localStorage;
let stored = null;
let blocked = false;
globalThis.window = new EventTarget();
globalThis.localStorage = {
  getItem: () => stored,
  setItem: (_, value) => { if (blocked) throw new Error("Storage blocked"); stored = value; },
};
try {
  for (const value of ["invalid json", "null", JSON.stringify({ location: { ...DEFAULT_LOCATION, latitude: 100 } }), JSON.stringify({ location: { ...DEFAULT_LOCATION, timezone: "Invalid/Zone" } })]) {
    stored = value;
    assert.equal(loadSettings().location.id, "delhi");
  }
  assert.equal(findCity("New Delhi").id, "delhi");
  for (const query of ["meerut", "  Meerut   UP ", "Meerut Uttar Pradesh", "Meerut, Uttar Pradesh, India"]) assert.equal(findCity(query).id, "meerut");
  assert.equal(findCity("Kashi").id, "varanasi");
  assert.equal(searchLocalPlaces("uttar pradesh").length > 1, true, "ambiguous local matches are not silently guessed");
  for (const [query, zone] of [["London", "Europe/London"], ["New York", "America/New_York"], ["Kathmandu", "Asia/Kathmandu"]]) assert.equal(findCity(query).timezone, zone);
  let notifications = 0;
  const unsubscribe = subscribeSettings(() => { notifications++; });
  const mumbai = { location: findCity("mumbai"), convention: "purnimanta" };
  saveSettings(mumbai);
  assert.deepEqual(loadSettings(), mumbai);
  saveSettings(mumbai);
  assert.equal(notifications, 1, "equal settings do not rebroadcast");
  const persistentCity = stored;
  saveSettings({ location: { ...findCity("meerut"), source: "geolocation", id: "device", altitude: null, accuracy: 9 }, convention: "amanta" });
  assert.equal(stored, persistentCity, "device precision is never persisted");
  assert.equal(loadSettings().location.altitude, 0);
  assert.equal(loadSettings().location.altitudeKnown, false);
  assert.equal(loadSettings().location.accuracy, 9);
  assert.equal(loadSavedSettings().location.id, "mumbai", "saved city is distinct from a temporary GPS override");
  saveSettings(mumbai);
  notifications = 1;
  blocked = true;
  const meerut = { location: findCity("meerut"), convention: "amanta" };
  saveSettings(meerut);
  assert.deepEqual(loadSettings(), meerut, "blocked persistence retains same-document session settings");
  assert.equal(notifications, 2);
  unsubscribe();
  saveSettings(mumbai);
  assert.equal(notifications, 2, "unsubscribed views receive no callbacks");
  blocked = false;
  saveSettings(mumbai);
  stored = JSON.stringify({ location: { ...DEFAULT_LOCATION, id: "device" }, convention: "amanta" });
  assert.equal(loadSettings().location.id, "delhi", "legacy persisted GPS is replaced with safe fallback");
  assert.equal(JSON.parse(stored).location.id, "delhi");
  console.log("PASS location settings: validation, alias, persistence, equality, blocked storage and unsubscribe");
} finally {
  if (previousWindow === undefined) delete globalThis.window; else globalThis.window = previousWindow;
  if (previousStorage === undefined) delete globalThis.localStorage; else globalThis.localStorage = previousStorage;
}
