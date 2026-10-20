/**
 * SanStudio Forms — Service Worker
 * ==================================
 * PWA service worker implementing:
 *  - Cache-first strategy for static assets
 *  - Network-first for API requests
 *  - Background sync for offline submissions
 *  - Precaching core shell
 */

const CACHE_VERSION    = 'v1.0.0';
const STATIC_CACHE     = `sanforms-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE    = `sanforms-dynamic-${CACHE_VERSION}`;
const OFFLINE_FALLBACK = '/index.html';

/** Static assets to precache (app shell) */
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/builder.html',
  '/form.html',
  '/responses.html',
  '/analytics.html',
  '/settings.html',
  '/manifest.json',
  '/styles/tokens.css',
  '/styles/reset.css',
  '/styles/base.css',
  '/styles/animations.css',
  '/styles/components.css',
  '/styles/layout.css',
  '/styles/themes/light.css',
  '/styles/themes/dark.css',
  '/styles/pages/dashboard.css',
  '/styles/pages/builder.css',
  '/styles/pages/form.css',
  '/styles/pages/responses.css',
  '/styles/pages/analytics.css',
  '/scripts/core/app.js',
  '/scripts/core/events.js',
  '/scripts/core/store.js',
  '/scripts/core/storage.js',
  '/scripts/core/api.js',
  '/scripts/core/router.js',
];

/* ================================================================
 * Install — precache static shell
 * ================================================================ */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, { cache: 'reload' })));
    }).then(() => self.skipWaiting())
  );
});

/* ================================================================
 * Activate — clean old caches
 * ================================================================ */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== STATIC_CACHE && key !== DYNAMIC_CACHE)
          .map(key => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

/* ================================================================
 * Fetch — routing strategy
 * ================================================================ */
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (let them through normally)
  if (request.method !== 'GET') return;

  // Skip Apps Script API calls (always network-first)
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Skip cross-origin requests not in our control
  if (url.origin !== self.location.origin) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets: cache-first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages: network-first with offline fallback
  if (request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // Everything else: network-first
  event.respondWith(networkFirst(request));
});

/* ================================================================
 * Background Sync — offline form submissions
 * ================================================================ */
self.addEventListener('sync', event => {
  if (event.tag === 'sync-responses') {
    event.waitUntil(syncOfflineResponses());
  }
});

/* ================================================================
 * Push Notifications (architecture ready)
 * ================================================================ */
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'SanStudio Forms', {
      body:  data.body || '',
      icon:  '/assets/icons/icon-192.png',
      badge: '/assets/icons/icon-96.png',
      data:  data,
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});

/* ================================================================
 * Helper: Strategy implementations
 * ================================================================ */

/**
 * Cache-first: serve from cache, fall back to network.
 * @param {Request} request
 */
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network-first: try network, fall back to cache.
 * @param {Request} request
 */
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

/**
 * Network-first with HTML offline fallback.
 * @param {Request} request
 */
async function networkFirstWithFallback(request) {
  try {
    const response = await fetch(request);
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match(OFFLINE_FALLBACK);
  }
}

/**
 * Detect static assets (CSS, JS, images, fonts).
 * @param {string} pathname
 */
function isStaticAsset(pathname) {
  return /\.(css|js|png|jpg|jpeg|gif|webp|svg|woff2?|ttf|eot|ico)$/.test(pathname);
}

/**
 * Sync offline-queued form responses.
 * Reads from IndexedDB sync_queue and posts to Apps Script API.
 */
async function syncOfflineResponses() {
  // Open IDB and get queued items
  // This mirrors the SyncQueue in storage.js
  const dbRequest = indexedDB.open('sanforms_db', 1);

  return new Promise((resolve) => {
    dbRequest.onsuccess = async (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('sync_queue')) {
        resolve();
        return;
      }

      const tx    = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const items = await new Promise(r => {
        const req = store.getAll();
        req.onsuccess = () => r(req.result);
        req.onerror   = () => r([]);
      });

      for (const item of items) {
        try {
          const res = await fetch(item.url, {
            method: 'POST',
            body:   JSON.stringify(item.payload),
            headers: { 'Content-Type': 'application/json' },
          });
          if (res.ok) {
            store.delete(item.id);
          }
        } catch {
          // Still offline, leave in queue
        }
      }

      resolve();
    };

    dbRequest.onerror = () => resolve();
  });
}
