const CACHE_NAME = "simba-v1";
const STATIC_ASSETS = [
  "/",
  "/en",
  "/en/shop",
  "/en/branches",
  "/manifest.json",
];

// Install - cache static assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

// Fetch - network first, cache fallback
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip API calls and non-GET requests - always go to network
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // Skip external URLs
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful responses (not 3xx, 4xx, 5xx)
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Network failed - try cache
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          // Offline fallback for navigation requests
          if (request.mode === "navigate") {
            return caches.match("/en");
          }
          return new Response("Offline", { status: 503 });
        });
      }),
  );
});
