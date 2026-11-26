// Service Worker — TRAVELER-MODE OFFLINE SUPPORT + network-first HTML.
// Cache strategy:
//   • HTML pages → network-first, cache as fallback (spotty WiFi abroad)
//   • Trip JSON (/api/trip) → stale-while-revalidate, always shows on load
//   • Icons → cache-first
//   • Other cross-origin requests (fonts, photo CDNs) → not intercepted
//   • Everything else same-origin → network with cache fallback
//
// Previously stale-while-revalidate on HTML caused users to see 1-visit-old
// HTML after every deploy. Network-first fixes that while preserving offline.

const CACHE_VERSION = 'tripva-v16';
const STATIC_CACHE  = 'tripva-static-v16';
const TRIP_CACHE    = 'tripva-trips-v16';

// Static assets that rarely change — cache aggressively
const STATIC_ASSETS = [
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/og-image.png',
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

  // ── Every other cross-origin request — let the browser fetch it natively ──
  // A fetch() made inside the worker is checked against the worker's own
  // connect-src CSP, which does not list Google Fonts or the photo hosts
  // (upload/thumb.wikimedia.org, Unsplash, Pexels). Routing them through the
  // worker failed with net::ERR_FAILED: returning visitors lost the brand
  // fonts and every Wikimedia trip photo. Native loads use img-src/style-src.
  if (url.origin !== self.location.origin) return;

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

  // ── Icons + static assets — cache-first ────────────────────────────────
  if (STATIC_ASSETS.some(a => url.pathname.includes(a))) {
    e.respondWith(caches.match(req).then(r => r || fetch(req)));
    return;
  }

  // ── Everything else — network, cache as fallback ───────────────────────
  e.respondWith(fetch(req).catch(() => caches.match(req).then(r => r || Response.error())));
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
