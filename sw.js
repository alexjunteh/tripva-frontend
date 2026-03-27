// Service Worker — stale-while-revalidate for HTML, cache-first for static assets
const CACHE_VERSION = 'roam-v6';
const STATIC_CACHE = 'roam-static-v6';

// Static assets that rarely change — cache aggressively
const STATIC_ASSETS = [
  '/trip-planner/icons/icon-192.png',
  '/trip-planner/icons/icon-512.png',
  // Ticket files — cached for offline access
  '/trip-planner/tickets/alex-accademia.jpg',
  '/trip-planner/tickets/alex-grindelwald.jpg',
  '/trip-planner/tickets/alex-uffizi.jpg',
  '/trip-planner/tickets/alex-venice-ec31.jpg',
  '/trip-planner/tickets/alex-venice-ir2017.jpg',
  '/trip-planner/tickets/concert-venice-imusici.pdf',
  '/trip-planner/tickets/doges-palace-fastrack.pdf',
  '/trip-planner/tickets/ky-accademia.jpg',
  '/trip-planner/tickets/ky-grindelwald.jpg',
  '/trip-planner/tickets/ky-uffizi.jpg',
  '/trip-planner/tickets/ky-venice-ec31.jpg',
  '/trip-planner/tickets/ky-venice-ir2017.jpg',
  '/trip-planner/tickets/vatican-1.jpg',
  '/trip-planner/tickets/vatican-2.jpg',
  '/trip-planner/tickets/vatican-3.jpg',
  '/trip-planner/tickets/venice-florence-alex.jpg',
  '/trip-planner/tickets/venice-florence-alex.pdf',
  '/trip-planner/tickets/venice-florence-ky.jpg',
  '/trip-planner/tickets/venice-florence-ky.pdf',
  '/trip-planner/tickets/venice-overview.jpg',
];

// HTML files to pre-cache on install
const HTML_ASSETS = [
  '/trip-planner/italy-test.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE)
        .then(c => c.addAll(STATIC_ASSETS)
          .catch(err => console.warn('[SW] Some static assets failed to cache:', err))),
      caches.open(CACHE_VERSION)
        .then(c => c.addAll(HTML_ASSETS)
          .catch(err => console.warn('[SW] HTML pre-cache failed:', err))),
    ]).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION && k !== STATIC_CACHE)
          .map(k => { console.log('[SW] Deleting old cache:', k); return caches.delete(k); })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // HTML pages — stale-while-revalidate
  // Serve cached version INSTANTLY, fetch fresh in background for next visit
  if (e.request.destination === 'document' || url.pathname.endsWith('.html')) {
    e.respondWith(
      caches.open(CACHE_VERSION).then(cache => {
        return cache.match(e.request).then(cached => {
          // Always fetch fresh in background to update cache for next load
          const fetchPromise = fetch(e.request).then(networkRes => {
            if (networkRes.ok) {
              cache.put(e.request, networkRes.clone());
            }
            return networkRes;
          }).catch(() => null);

          // Return cached immediately if available, otherwise wait for network
          return cached || fetchPromise;
        });
      })
    );
    return;
  }

  // Ticket files (PDFs + images) — cache-first for offline access
  if (url.pathname.includes('/tickets/')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then(c => c.put(e.request, clone));
          }
          return res;
        });
      })
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
