/* First-touch marketing attribution.
   On any page opened with utm_source / utm_medium / utm_campaign in the URL, the
   values (plus landing path and time) are kept in localStorage, but only when no
   first touch is stored yet: the first channel wins, for 90 days.
   window.TripvaUtm.get() gives { utm_source, utm_medium, utm_campaign } (or null)
   for trip creation and trip saves; TripvaUtm.sync(session) sends it once per
   user to the backend so the profile keeps the channel that brought the sign-up.
   Everything here is best effort: nothing may break a page or a request. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.TripvaUtm = api;
})(typeof self !== 'undefined' ? self : this, function () {
  var KEY = 'tripva_first_touch';
  var SENT_KEY = 'tripva_first_touch_sent';
  var TTL_MS = 90 * 864e5;
  var MAX = 100;
  var BACKEND = 'https://tripai-backend.vercel.app';

  function clip(v) {
    if (typeof v !== 'string') return null;
    // eslint-disable-next-line no-control-regex
    v = v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX).trim();
    return v || null;
  }

  function read(store, now) {
    try {
      var v = JSON.parse(store.getItem(KEY) || 'null');
      if (!v || typeof v.ts !== 'number') return null;
      if (now - v.ts > TTL_MS) { store.removeItem(KEY); return null; }
      return v;
    } catch (e) { return null; }
  }

  // Store the landing's UTMs unless a first touch already exists. Returns the
  // stored first touch (old or new), or null.
  function capture(search, path, store, now) {
    var cur = read(store, now);
    if (cur) return cur;
    var p;
    try { p = new URLSearchParams(search || ''); } catch (e) { return null; }
    var v = {
      utm_source: clip(p.get('utm_source')),
      utm_medium: clip(p.get('utm_medium')),
      utm_campaign: clip(p.get('utm_campaign')),
      landing_path: String(path || '/').slice(0, 200),
      ts: now
    };
    if (!v.utm_source && !v.utm_medium && !v.utm_campaign) return null;
    try { store.setItem(KEY, JSON.stringify(v)); } catch (e) { return null; }
    return v;
  }

  function payload(v) {
    return v ? { utm_source: v.utm_source || null, utm_medium: v.utm_medium || null, utm_campaign: v.utm_campaign || null } : null;
  }

  function userIdOf(token) {
    try {
      var part = String(token).split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(part)).sub || null;
    } catch (e) { return null; }
  }

  // Reading localStorage itself can throw (privacy modes, sandboxed frames).
  function storage() {
    try { return typeof localStorage !== 'undefined' ? localStorage : null; } catch (e) { return null; }
  }

  function get(store, now) {
    store = store || storage();
    if (!store) return null;
    return payload(read(store, now || Date.now()));
  }

  // Send the first touch to the signed-in user's profile, once per user and
  // first touch. Resolves true when the backend accepted it.
  function sync(session, opts) {
    opts = opts || {};
    var store = opts.store || storage();
    var doFetch = opts.fetch || (typeof fetch !== 'undefined' ? fetch : null);
    var now = opts.now || Date.now();
    if (!store || !doFetch || !session || !session.access_token) return Promise.resolve(false);
    if (session.expires_at && now > session.expires_at) return Promise.resolve(false);
    var v = read(store, now);
    if (!v) return Promise.resolve(false);
    var marker = v.ts + ':' + (userIdOf(session.access_token) || '?');
    try { if (store.getItem(SENT_KEY) === marker) return Promise.resolve(false); } catch (e) {}
    return Promise.resolve().then(function () {
      return doFetch((opts.backend || BACKEND) + '/api/user/attribution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.access_token },
        body: JSON.stringify({ utm: payload(v) })
      });
    }).then(function (r) {
      if (r && r.ok) { try { store.setItem(SENT_KEY, marker); } catch (e) {} return true; }
      return false;
    }).catch(function () { return false; });
  }

  var api = { KEY: KEY, SENT_KEY: SENT_KEY, TTL_MS: TTL_MS, capture: capture, get: get, sync: sync, read: read };

  // Browser: capture this landing, then sync a session that already exists.
  if (typeof window !== 'undefined' && typeof location !== 'undefined') {
    try {
      var store = storage();
      if (store) {
        capture(location.search, location.pathname, store, Date.now());
        var s = JSON.parse(store.getItem('tripva_session') || 'null');
        if (s && s.access_token) sync(s);
      }
    } catch (e) {}
  }
  return api;
});
