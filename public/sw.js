const CACHE_NAME = 'nowauth-pwa-v2';

// Core shell assets to precache for reliable PWA installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/maskable-icon-512x512.png',
];

// Install: precache the core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn('[SW] Precache failed during install:', err);
      })
  );
});

// Activate: clean up outdated caches and take control immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: enforce strict safety rules
// 1. NEVER cache or intercept /api/ requests (live network only)
// 2. NEVER cache POST / PUT / DELETE or non-GET requests
// 3. Navigation requests use Network-First, falling back to cached shell if offline
// 4. Static assets (JS, CSS, static images, fonts) use Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-http(s) requests (e.g. chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Rule 1 & 2: Bypass cache for API calls, admin requests, and non-GET methods
  if (request.method !== 'GET' || url.pathname.startsWith('/api')) {
    return;
  }

  // Rule 3: HTML / Navigation requests (e.g. /, /verify, /verify?code=..., /admin)
  // Network-first ensures live content and query parameters are preserved.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          // Keep the shell cache updated if successful
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback to cached SPA shell
          const cachedShell = await caches.match('/index.html');
          return cachedShell || Response.error();
        })
    );
    return;
  }

  // Rule 4: Static assets (scripts, styles, images, fonts)
  // Stale-While-Revalidate: fast render from cache while keeping assets fresh
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
