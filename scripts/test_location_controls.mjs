import assert from "node:assert/strict";
import { manualLocation, locationFromPosition, searchResultLocation, geolocationError, GEOLOCATION_OPTIONS } from "../docs/assets/panchang/location-controls.mjs";

const manual = manualLocation({ latitude: "28.99", longitude: "77.7", altitude: "", timezone: "Asia/Kolkata" });
assert.equal(manual.altitude, 0);
assert.equal(manual.altitudeKnown, false);
assert.equal(manual.timezoneOffset, 330);
for (const changes of [{ latitude: "" }, { latitude: null }, { latitude: 91 }, { longitude: 181 }, { altitude: "bad" }, { altitude: 10001 }, { timezone: "Invalid/Zone" }]) {
  assert.throws(() => manualLocation({ latitude: 10, longitude: 20, altitude: 30, timezone: "Asia/Kolkata", ...changes }));
}
const gps = locationFromPosition({ latitude: 12, longitude: 34, altitude: null, accuracy: 8 }, "UTC");
assert.equal(gps.source, "geolocation");
assert.equal(gps.altitudeKnown, false);
assert.equal(gps.accuracy, 8);
assert.equal(gps.timezoneOffset, 0);
assert.ok(GEOLOCATION_OPTIONS.enableHighAccuracy);
const found = searchResultLocation({ osm_id: 123, osm_type: "relation", display_name: "Vrindavan, Uttar Pradesh, India", lat: "27.58", lon: "77.7", address: { country_code: "in" } });
assert.equal(found.timezone, "Asia/Kolkata");
assert.equal(found.altitudeKnown, false);
assert.equal(found.source, "search");
assert.equal(searchResultLocation({ ...found, lat: "nan", address: { country_code: "in" } }), null);
assert.equal(searchResultLocation({ lat: 10, lon: 20, display_name: "Outside India", address: { country_code: "us" } }), null);
for (const [code, phrase] of [[1, "denied"], [2, "determine"], [3, "timed out"]]) assert.match(geolocationError({ code }), new RegExp(phrase));
console.log("PASS location controls: search validation, India restriction, unknown elevation, manual bounds, timezone, GPS accuracy/privacy and error distinctions");
