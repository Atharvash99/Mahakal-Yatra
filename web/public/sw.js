// Minimal service worker for the driver portal: keeps the app shell available
// offline. API calls are never cached, so trip data is always live.
const CACHE = "mahakalyatra-driver-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["/driver", "/icon.svg"])));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/driver")) {
    e.respondWith(fetch(e.request).catch(() => caches.match("/driver")));
  }
});
