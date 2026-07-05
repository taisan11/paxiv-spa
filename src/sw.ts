const CACHE_VERSION = "paxiv-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const API_CACHE = `${CACHE_VERSION}-api`;

const PRECACHE_ASSETS: string[] = ["FILE_LIST"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then((c) => c.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

async function cacheFirst(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request: Request, cacheName: string): Promise<Response> {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) cache.put(request, response.clone());
    return response;
  });
  return cached || fetchPromise;
}

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  if (e.request.destination === "image" || url.hostname === "corsproxy.io") {
    e.respondWith(cacheFirst(e.request, IMAGE_CACHE));
    return;
  }

  if (url.hostname === "www.pixiv.net" && url.pathname.startsWith("/ajax/")) {
    e.respondWith(staleWhileRevalidate(e.request, API_CACHE));
    return;
  }

  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request)
        .then((r) => {
          if (r.ok) {
            caches.open(STATIC_CACHE).then((c) => c.put(e.request, r.clone()));
          }
          return r;
        })
        .catch(() => caches.match("/index.html") as Promise<Response>)
    );
    return;
  }
});
