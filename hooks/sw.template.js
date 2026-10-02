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
    await Promise.all(names.filter((name) =>
      (name.startsWith("udhc-") && ![SHELL_CACHE, RUNTIME_CACHE].includes(name)) || name.startsWith("abp-")
    ).map((name) => caches.delete(name)));
    await self.clients.claim();
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
    event.respondWith(staleWhileRevalidate(request));
  }
});
