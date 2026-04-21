// Service Worker — TRAVELER-MODE OFFLINE SUPPORT + network-first HTML.
// Cache strategy:
//   • HTML pages → network-first, cache as fallback (spotty WiFi abroad)
//   • Trip JSON (/api/trip) → stale-while-revalidate, always shows on load
//   • Tickets (PDFs/images) → cache-first, essential for boarding passes
//   • Icons / fonts → cache-first
//   • Everything else → network with cache fallback
//
// Previously stale-while-revalidate on HTML caused users to see 1-visit-old
// HTML after every deploy. Network-first fixes that while preserving offline.

const CACHE_VERSION = 'tripva-v11';
const STATIC_CACHE  = 'tripva-static-v11';
const TRIP_CACHE    = 'tripva-trips-v11';

// Static assets that rarely change — cache aggressively
const STATIC_ASSETS = [
  '/trip-planner/icons/icon-192.png',
  '/trip-planner/icons/icon-512.png',
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

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(STATIC_CACHE)
      .then(c => c.addAll(STATIC_ASSETS).catch(err => console.warn('[SW] some static assets failed:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => ![CACHE_VERSION, STATIC_CACHE, TRIP_CACHE].includes(k))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);

  // ── Trip JSON from Vercel backend — stale-while-revalidate ─────────────
  // Every time tripva.app/trip loads it fetches /api/trip?id=... to hydrate.
  // SWR means: return cached copy INSTANTLY (zero-latency paint when offline
  // or poor WiFi), then fetch fresh in background to update next time. Abroad
  // travelers get their plan without waiting for mobile data.
  if (url.hostname === 'tripai-backend.vercel.app' && url.pathname === '/api/trip') {
    e.respondWith(tripSWR(req));
    return;
  }

  // ── HTML pages — network-first, cache fallback (see above) ─────────────
  if (req.destination === 'document' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then(c => c.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.open(CACHE_VERSION).then(c => c.match(req)))
    );
    return;
  }

  // ── Tickets — cache-first (boarding passes MUST work offline) ──────────
  if (url.pathname.includes('/tickets/')) {
    e.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(res => {
          if (res.ok) caches.open(STATIC_CACHE).then(c => c.put(req, res.clone()));
          return res;
        });
      })
    );
    return;
  }

  // ── Icons + static assets — cache-first ────────────────────────────────
  if (STATIC_ASSETS.some(a => url.pathname.includes(a.replace('/trip-planner', '')))) {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
    return;
  }

  // ── Day hero photos (Unsplash, picsum, loremflickr, Wikimedia) ─────────
  // Cache-first with network refresh — trip photos are highly reused per
  // trip and don't change, keep them offline for the journey.
  if (/\.(jpg|jpeg|png|webp|avif)(\?|$)/i.test(url.pathname) && url.hostname !== location.hostname) {
    e.respondWith(
      caches.match(req).then(cached => {
        const fetchAndCache = fetch(req).then(res => {
          if (res.ok) caches.open(STATIC_CACHE).then(c => c.put(req, res.clone()));
          return res;
        }).catch(() => cached || Response.error());
        return cached || fetchAndCache;
      })
    );
    return;
  }

  // ── Everything else — network, cache as fallback ───────────────────────
  e.respondWith(fetch(req).catch(() => caches.match(req)));
});

// ── Helper: stale-while-revalidate for trip JSON ─────────────────────────
async function tripSWR(req) {
  const cache = await caches.open(TRIP_CACHE);
  const cached = await cache.match(req);
  const network = fetch(req).then(res => {
    if (res && res.ok) cache.put(req, res.clone());
    return res;
  }).catch(() => null);
  // Return cached immediately if we have it, fetching in background.
  // If no cache, wait on network; if that fails, return a synthetic 503
  // so the caller can show the offline banner without throwing.
  return cached || (await network) || new Response(JSON.stringify({ error: 'offline' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
}

// ── BACKGROUND SYNC for queued edits ─────────────────────────────────────
// Frontend queues mark-booked / add-link / ai-edit requests in IndexedDB
// when offline. Service Worker fires them off when connectivity returns.
// Frontend listens for 'edits-synced' message and re-renders.
self.addEventListener('sync', e => {
  if (e.tag === 'tripva-edit-sync') {
    e.waitUntil(replayQueuedEdits());
  }
});

async function replayQueuedEdits() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(c => c.postMessage({ type: 'replay-edits' }));
  } catch (_) {}
}

// ── Web Push handler ─────────────────────────────────────────────────────
// Payload: { title, body, icon, badge, url, tag }. Clicking a notification
// focuses an existing Tripva tab at the trip URL, or opens a new one.
self.addEventListener('push', e => {
  if (!e.data) return;
  let payload;
  try { payload = e.data.json(); } catch (_) { payload = { title: 'Tripva', body: e.data.text() }; }
  e.waitUntil(self.registration.showNotification(payload.title || 'Tripva', {
    body:  payload.body || '',
    icon:  payload.icon  || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    tag:   payload.tag   || undefined,
    data:  { url: payload.url || '/mytrips.html' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const target = (e.notification.data && e.notification.data.url) || '/';
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      // If a Tripva tab is already open, focus + navigate it
      for (const c of list) {
        if (c.url.includes('tripva.app') && 'focus' in c) {
          c.navigate(target).catch(() => {});
          return c.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
