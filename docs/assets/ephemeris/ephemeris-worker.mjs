// SPDX-License-Identifier: AGPL-3.0-or-later
import { loadEphemerisEngine, calculateEphemeris } from "./ephemeris-engine.mjs";
import { calculateMonth, findMonthEvents } from "./monthly.mjs";
let enginePromise;
// Each worker has one isolated WASM instance. Jobs run serially.
let queue = Promise.resolve();
self.onmessage = ({ data }) => {
  queue = queue.then(async () => {
    try {
      enginePromise ||= loadEphemerisEngine().catch((error) => { enginePromise = null; throw error; });
      const engine = await enginePromise;
      let result;
      if (data.type === "month") {
        result = calculateMonth(engine, data.request, (done, total) => self.postMessage({ id: data.id, progress: `${done}/${total} days` }));
        result.eventsUnavailable = data.request.events && data.request.year === 2399 && data.request.month === 12;
        result.events = data.request.events && !result.eventsUnavailable ? findMonthEvents(engine, data.request) : [];
      } else result = calculateEphemeris(engine, data.request);
      self.postMessage({ id: data.id, result });
    } catch (error) { self.postMessage({ id: data.id, error: error.message || "Ephemeris engine unavailable. Please reload or try again." }); }
  });
};
