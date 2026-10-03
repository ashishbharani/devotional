/* UDHC service worker: shell-only precache plus pages visited by the reader. */
const VERSION = "__UDHC_VERSION__";
const SHELL_CACHE = `udhc-shell-${VERSION}`;
const RUNTIME_CACHE = `udhc-runtime-${VERSION}`;
const SHELL = __UDHC_SHELL__;
const scopeUrl = new URL(self.registration.scope);
const inScope = (url) => url.origin === scopeUrl.origin && url.pathname.startsWith(scopeUrl.pathname);
const shellUrls = () => SHELL.map((path) => new URL(path, scopeUrl).href);

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((cache) => cache.addAll(shellUrls())).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    const migratingPanchang = names.some((name) => name.startsWith("udhc-") && ![SHELL_CACHE, RUNTIME_CACHE].includes(name));
    await Promise.all(names.filter((name) =>
      (name.startsWith("udhc-") && ![SHELL_CACHE, RUNTIME_CACHE].includes(name)) || name.startsWith("abp-")
    ).map((name) => caches.delete(name)));
    await self.clients.claim();
    // Older deployed pages have no controllerchange handler. Reload only
    // Panchanga-bearing pages during an actual cache-version migration.
    if (migratingPanchang) {
      const clients = await self.clients.matchAll({ type: "window" });
      clients.filter((client) => {
        const path = new URL(client.url).pathname.slice(scopeUrl.pathname.length);
        return ["", "panchang/", "hindu-calendar/", "date-converter/"].includes(path);
      }).forEach((client) => {
        // Do not await navigation inside activate: its fetch can wait for this
        // activation to finish, otherwise both operations wait on each other.
        client.navigate(client.url).catch((error) => console.warn("Panchanga update reload failed", error));
      });
    }
  })());
});

async function remember(request, response) {
  if (response && response.ok && response.type === "basic") {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  try {
    return await remember(request, await fetch(request));
  } catch (error) {
    return (await caches.match(request)) || (await caches.match(new URL("offline/", scopeUrl).href));
  }
}

async function staleWhileRevalidate(request) {
  const cached = await caches.match(request);
  const network = fetch(request).then((response) => remember(request, response)).catch(() => null);
  return cached || (await network) || Response.error();
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || !inScope(url)) return;
  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }
  if (url.pathname.endsWith(".json") || /\.(?:css|m?js|svg|png|jpe?g|webp|woff2?)$/i.test(url.pathname)) {
    // Calculation modules are one versioned, precached set. Mixing a new
    // adapter with an old engine during background revalidation is unsafe.
    if (url.pathname.includes("/assets/panchang/")) {
      event.respondWith(caches.open(SHELL_CACHE).then(async (cache) => (await cache.match(request)) || fetch(request)));
      return;
    }
    event.respondWith(staleWhileRevalidate(request));
  }
});
