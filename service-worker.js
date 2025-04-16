// Service Worker Version
const CACHE_VERSION = "v1";
const CACHE_NAME = `adarsh-portfolio-${CACHE_VERSION}`;

// Files to cache for offline use
const urlsToCache = [
  "/",
  "/index.html",
  "/index.css",
  "/manifest.json",
  "/img/favicon.png",
  "/img/profile.jpg",
  "/img/querit.png",
  "/img/portfolio.png",
  "/img/hive.png",
  "/img/blossoms.png",
  "/img/trustvault.png",
];

// Install event - cache initial resources
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Cache hit - return response
      if (response) {
        return response;
      }

      // Clone the request because it can only be used once
      const fetchRequest = event.request.clone();

      // Network request for uncached resources
      return fetch(fetchRequest)
        .then((response) => {
          // Check if valid response
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Clone the response because it can only be used once
          const responseToCache = response.clone();

          // Open cache and store the new response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch((error) => {
          // Offline fallback for HTML pages
          if (event.request.headers.get("accept").includes("text/html")) {
            return caches.match("/index.html");
          }
        });
    })
  );
});
