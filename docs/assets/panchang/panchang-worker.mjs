import { calculatePanchangDay, calculatePanchangMonth, clearPanchangCache } from "./panchang-adapter.mjs";

// One module worker owns the engine and caches for every view in this page.
self.onmessage = async ({ data: { id, method, args } }) => {
  try {
    let result;
    if (method === "day") result = await calculatePanchangDay(...args);
    else if (method === "month") result = await calculatePanchangMonth(...args, (complete, total) => self.postMessage({ id, progress: [complete, total] }));
    else if (method === "clear") clearPanchangCache();
    else throw new Error("Unknown Panchanga calculation request.");
    // Dates survive structured cloning; do not stringify astronomical instants.
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, error: error.message || String(error) });
  }
};
