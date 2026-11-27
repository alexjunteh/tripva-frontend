// Tripva affiliate click ping (27 Nov 2026).
// One capture listener for every outbound partner link on the page. It posts
// {partner, destination, tripId} to the backend's /api/track, where tripId is
// the trip id on trip pages or "blog:<slug>" on blog posts. sendBeacon sends
// text/plain (no CORS preflight) and survives the page opening a new tab.
// Links that already call trackAffiliateClick() in trip.html are skipped so a
// click is never counted twice.
(function () {
  'use strict';
  if (window.__tripvaClickTrack) return;
  window.__tripvaClickTrack = true;

  var ENDPOINT = 'https://tripai-backend.vercel.app/api/track';
  var HOSTS = [
    ['klook.com', 'klook'], ['aviasales', 'aviasales'], ['jetradar', 'aviasales'],
    ['kiwi.com', 'kiwi'], ['tiqets', 'tiqets'], ['airalo', 'airalo'],
    ['booking.com', 'booking'], ['agoda', 'agoda'], ['getyourguide', 'gyg'],
    ['rail.ninja', 'railninja'], ['12go', '12go'], ['discovercars', 'discovercars'],
    ['trainline', 'trainline'], ['trip.com', 'tripcom'], ['hotels.com', 'hotelscom'],
    ['/api/flights/activity-link', 'activity'], ['/api/flights/hotel-link', 'hotel'],
  ];

  function partnerFor(href) {
    var url;
    try { url = new URL(href, location.href); } catch (e) { return ''; }
    var target = url.href;
    // tp.media/r?u=<partner url>: name the brand behind the redirect.
    if (url.hostname === 'tp.media') target = url.searchParams.get('u') || '';
    var s = String(target).toLowerCase();
    for (var i = 0; i < HOSTS.length; i++) if (s.indexOf(HOSTS[i][0]) !== -1) return HOSTS[i][1];
    return url.hostname === 'tp.media' ? 'travelpayouts' : '';
  }

  function source() {
    var path = location.pathname.replace(/\.html$/, '').replace(/\/+$/, '');
    var m = path.match(/^\/blog\/([^/]+)$/);
    if (m) return 'blog:' + m[1];
    if (/^\/blog$/.test(path)) return 'blog:index';
    var id = new URLSearchParams(location.search).get('id');
    if (id) return id;
    return 'page:' + (path.replace(/^\//, '') || 'home');
  }

  function destination(a) {
    if (a.dataset && a.dataset.destination) return a.dataset.destination;
    try { if (typeof plan !== 'undefined' && plan && plan.trip) return plan.trip.destination || ''; } catch (e) {}
    var meta = document.querySelector('meta[name="tripva:destination"]');
    return meta ? meta.content : '';
  }

  var last = { href: '', t: 0 };
  function onClick(ev) {
    var a = ev.target && ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    if (ev.type === 'auxclick' && ev.button !== 1) return;
    var inline = a.getAttribute('onclick') || '';
    if (inline.indexOf('trackAffiliateClick') !== -1) return;
    var partner = partnerFor(a.getAttribute('href'));
    if (!partner) return;
    var now = Date.now();
    if (last.href === a.href && now - last.t < 1500) return;
    last = { href: a.href, t: now };
    var body = JSON.stringify({ partner: partner, destination: destination(a), tripId: source() });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, body)) return;
    } catch (e) {}
    try {
      fetch(ENDPOINT, { method: 'POST', body: body, keepalive: true, mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' } }).catch(function () {});
    } catch (e) {}
  }

  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);
  window.__tripvaPartnerFor = partnerFor;
})();
