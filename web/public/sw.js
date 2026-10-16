// PowrFit service worker (P1-09).
//
// Deliberately narrow: it never touches cross-origin requests (Firebase Auth,
// Firestore, Google APIs) or the app's /api/* and /__/* paths, so sign-in and
// data always go straight to the network. It only:
//   - serves hashed build assets (/_next/static/*) cache-first, and
//   - shows /offline.html when a page navigation fails offline.
// Bump CACHE_NAME whenever this file's caching behaviour changes.

const CACHE_NAME = "powrfit-shell-v2";
const SHELL_ASSETS = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

/** "static", "navigate" or null (leave the request to the browser). */
function strategyFor(request) {
  if (request.method !== "GET") return null;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return null;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/__/")) return null;

  if (url.pathname.startsWith("/_next/static/")) return "static";
  if (request.mode === "navigate") return "navigate";
  return null;
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkWithOfflinePage(request) {
  try {
    return await fetch(request);
  } catch {
    const offline = await caches.match("/offline.html");
    return offline ?? Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const strategy = strategyFor(event.request);
  if (strategy === "static") event.respondWith(cacheFirst(event.request));
  if (strategy === "navigate") event.respondWith(networkWithOfflinePage(event.request));
});
