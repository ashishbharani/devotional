/* One-release migration worker.
 *
 * The former site installed an offline-first service worker and abp-* caches.
 * This replacement activates immediately, removes only this site's ABP caches,
 * claims any already-open pages, and unregisters itself. It has no fetch handler,
 * so the collection returns to normal browser/network behaviour.
 */
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("abp-")).map((key) => caches.delete(key)));
    await self.clients.claim();
    await self.registration.unregister();
  })());
});
