// Service Worker — stale-while-revalidate for HTML, cache-first for static assets
const CACHE_VERSION = 'tripva-v9';
const STATIC_CACHE = 'tripva-static-v9';

// Static assets that rarely change — cache aggressively
const STATIC_ASSETS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  // Ticket files — cached for offline access
  '/tickets/alex-accademia.jpg',
  '/tickets/alex-grindelwald.jpg',
  '/tickets/alex-uffizi.jpg',
  '/tickets/alex-venice-ec31.jpg',
  '/tickets/alex-venice-ir2017.jpg',
  '/tickets/concert-venice-imusici.pdf',
  '/tickets/doges-palace-fastrack.pdf',
  '/tickets/ky-accademia.jpg',
  '/tickets/ky-grindelwald.jpg',
  '/tickets/ky-uffizi.jpg',
  '/tickets/ky-venice-ec31.jpg',
  '/tickets/ky-venice-ir2017.jpg',
  '/tickets/vatican-1.jpg',
  '/tickets/vatican-2.jpg',
  '/tickets/vatican-3.jpg',
  '/tickets/venice-florence-alex.jpg',
  '/tickets/venice-florence-alex.pdf',
  '/tickets/venice-florence-ky.jpg',
  '/tickets/venice-florence-ky.pdf',
  '/tickets/venice-overview.jpg',
];

// HTML files to pre-cache on install
const HTML_ASSETS = [
  '/italy-test.html',
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
