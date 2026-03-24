// Service Worker — network-first for HTML, cache-first for static assets
const CACHE_VERSION = 'roam-v3';
const STATIC_CACHE = 'roam-static-v3';

// Static assets that rarely change — cache aggressively
const STATIC_ASSETS = [
  '/trip-planner/icons/icon-192.png',
  '/trip-planner/icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c => c.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())  // activate immediately, don't wait for old SW to die
  );
});

self.addEventListener('activate', e => {
  // Nuke ALL old caches
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION && k !== STATIC_CACHE)
          .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k); })
      )
    ).then(() => self.clients.claim())  // take control of all open pages immediately
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML pages — ALWAYS network-first, fall back to cache only if truly offline
  if (e.request.destination === 'document' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })  // bypass HTTP cache for HTML
        .then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(e.request, clone));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Static assets (icons) — cache-first
  if (STATIC_ASSETS.some(a => url.pathname.includes(a.replace('/trip-planner', '')))) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
    return;
  }

  // Everything else — network with cache fallback
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
