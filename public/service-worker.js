// Service Worker Version - Increment this when making changes
const CACHE_VERSION = "v3";
const CACHE_NAME = `adarsh-portfolio-${CACHE_VERSION}`;
const ASSETS_CACHE_NAME = `assets-${CACHE_VERSION}`;

// Files to cache for offline use - core files first
const CORE_ASSETS = [
  "/",
  "/index.html",
  "/index.css",
  "/manifest.json",
  "/pwa-test.html",
];

// Image assets that can be cached with lower priority
const IMAGE_ASSETS = [
  "/img/favicon.png",
  "/img/profile.jpg",
  "/img/querit.png",
  "/img/portfolio.png",
  "/img/hive.png",
  "/img/blossoms.png",
  "/img/trustvault.png",
  "/img/screenshot1.png",
];

// Install event - cache initial core resources
self.addEventListener("install", (event) => {
  console.log(`[Service Worker] Installing new version ${CACHE_VERSION}`);
  event.waitUntil(
    // Cache core assets immediately - these are critical for the app
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching core files");
        return cache.addAll(CORE_ASSETS);
      })
      .then(() => {
        // Cache image assets separately - lower priority
        return caches.open(ASSETS_CACHE_NAME).then((cache) => {
          console.log("[Service Worker] Caching image assets");
          return cache.addAll(IMAGE_ASSETS);
        });
      })
      .then(() => {
        console.log("[Service Worker] Install complete");
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[Service Worker] Install failed:", error);
      })
  );
});

// Activate event - clean up old caches and take control
self.addEventListener("activate", (event) => {
  console.log(`[Service Worker] Activating new version ${CACHE_VERSION}`);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete any cache that doesn't match our current version
            if (cacheName !== CACHE_NAME && cacheName !== ASSETS_CACHE_NAME) {
              console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log("[Service Worker] Claiming clients");
        // Take control of all clients/pages
        return self.clients.claim();
      })
      .then(() => {
        // Notify all clients that the service worker has activated
        return self.clients.matchAll().then((clients) => {
          clients.forEach((client) => {
            client.postMessage({
              type: "SERVICE_WORKER_ACTIVATED",
              version: CACHE_VERSION,
            });
          });
        });
      })
      .catch((error) => {
        console.error("[Service Worker] Activation failed:", error);
      })
  );
});

// Fetch event - stale-while-revalidate strategy
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Skip cache for chrome-extension requests
  if (url.protocol === "chrome-extension:") {
    return;
  }

  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // For navigation requests (HTML pages) use a network-first strategy
  if (
    event.request.mode === "navigate" ||
    (event.request.method === "GET" &&
      event.request.headers.get("accept").includes("text/html"))
  ) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // If we got a valid response, clone it and put it in the cache
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache, or fall back to offline page
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match("/index.html");
          });
        })
    );
    return;
  }

  // For image resources, use a cache-first strategy
  if (
    url.pathname.startsWith("/img/") ||
    event.request.destination === "image"
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // Return cached response if available
        if (cachedResponse) {
          // Revalidate the cache in the background
          fetch(event.request)
            .then((response) => {
              if (response && response.status === 200) {
                caches
                  .open(ASSETS_CACHE_NAME)
                  .then((cache) => cache.put(event.request, response.clone()));
              }
            })
            .catch(() => {});

          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone and cache the fresh response
          const responseToCache = response.clone();
          caches
            .open(ASSETS_CACHE_NAME)
            .then((cache) => cache.put(event.request, responseToCache));

          return response;
        });
      })
    );
    return;
  }

  // For all other requests, use a stale-while-revalidate strategy
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Clone the request because it might be used twice
      const fetchRequest = event.request.clone();

      // Start network fetch in parallel
      const fetchPromise = fetch(fetchRequest)
        .then((networkResponse) => {
          // If we got a valid response, clone it and update the cache
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches
              .open(CACHE_NAME)
              .then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch((error) => {
          console.log("[Service Worker] Fetch failed:", error);
          return null;
        });

      // Return the cached response immediately if we have it,
      // otherwise wait for the network response
      return cachedResponse || fetchPromise;
    })
  );
});

// App-specific events for better PWA experience
// Handle messages from the main thread
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Received message:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[Service Worker] Skipping waiting phase");
    self
      .skipWaiting()
      .then(() => {
        console.log("[Service Worker] Skip waiting complete");
        // Notify the client that skipWaiting was successful
        event.ports[0]?.postMessage({ type: "SKIP_WAITING_COMPLETE" });
      })
      .catch((error) => {
        console.error("[Service Worker] Skip waiting failed:", error);
      });
  } else if (event.data && event.data.type === "CHECK_VERSION") {
    // Respond with current version information
    event.ports[0]?.postMessage({
      type: "VERSION_INFO",
      version: CACHE_VERSION,
    });
  }
});

// Periodic background sync
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "content-sync") {
    event.waitUntil(syncContent());
  }
});

// Helper function for periodic content sync
async function syncContent() {
  try {
    console.log("[Service Worker] Starting background sync");

    // Refresh core assets
    const coreCache = await caches.open(CACHE_NAME);

    // Refresh each core asset
    for (const url of CORE_ASSETS) {
      try {
        const response = await fetch(url, { cache: "reload" });
        if (response && response.status === 200) {
          await coreCache.put(url, response);
          console.log(`[Service Worker] Refreshed: ${url}`);
        }
      } catch (error) {
        console.error(`[Service Worker] Failed to refresh ${url}:`, error);
      }
    }

    console.log("[Service Worker] Background sync completed");
    return true;
  } catch (error) {
    console.error("[Service Worker] Background sync failed:", error);
    return false;
  }
}

// Utility function to clean up outdated caches
async function trimCache() {
  try {
    const cache = await caches.open(ASSETS_CACHE_NAME);
    const keys = await cache.keys();

    if (keys.length > 100) {
      // Keep cache size reasonable
      console.log(
        `[Service Worker] Cache size exceeded limit (${keys.length}), trimming...`
      );

      // Delete oldest entries (we'll keep the most recent 80%)
      const deleteCount = Math.floor(keys.length * 0.2);

      for (let i = 0; i < deleteCount; i++) {
        await cache.delete(keys[i]);
      }

      console.log(`[Service Worker] Removed ${deleteCount} old cache entries`);
    }
  } catch (error) {
    console.error("[Service Worker] Error trimming cache:", error);
  }
}
