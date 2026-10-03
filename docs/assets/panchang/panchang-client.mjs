let worker;
let serial = 0;
const requests = new Map();

function stop(error) {
  for (const request of requests.values()) { clearTimeout(request.timer); request.reject(error); }
  requests.clear();
  worker?.terminate();
  worker = null;
}

function call(method, args, progress) {
  return new Promise((resolve, reject) => {
    if (!worker) {
      worker = new Worker(new URL("./panchang-worker.mjs", import.meta.url), { type: "module" });
      worker.onmessage = ({ data }) => {
        const request = requests.get(data.id);
        if (!request) return;
        if (data.progress) { request.progress?.(...data.progress); return; }
        clearTimeout(request.timer);
        requests.delete(data.id);
        if (data.error) request.reject(new Error(data.error));
        else request.resolve(data.result);
      };
      worker.onerror = (event) => stop(new Error(event.message || "Panchanga worker could not be loaded."));
      worker.onmessageerror = () => stop(new Error("Panchanga results could not be read."));
    }
    const id = ++serial;
    const timer = setTimeout(() => stop(new Error("Panchanga calculation timed out.")), 60000);
    requests.set(id, { resolve, reject, progress, timer });
    worker.postMessage({ id, method, args });
  });
}

export const calculatePanchangDay = (date, settings) => call("day", [date, settings]);
export const calculatePanchangMonth = (year, month, settings, progress) => call("month", [year, month, settings], progress);
export const clearPanchangCache = () => call("clear", []).catch((error) => console.error("Panchanga cache reset failed", error));
