import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { readFileSync, readdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const U = require('../assets/utm.js');

const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k), _m: m }; };
const DAY = 864e5;
const jwt = sub => 'h.' + Buffer.from(JSON.stringify({ sub })).toString('base64url') + '.s';

test('stores the UTMs of a tagged landing with path and time', () => {
  const s = mem();
  const v = U.capture('?utm_source=facebook&utm_medium=social&utm_campaign=nov', '/blog/kyoto.html', s, 1000);
  assert.deepEqual(v, { utm_source: 'facebook', utm_medium: 'social', utm_campaign: 'nov', landing_path: '/blog/kyoto.html', ts: 1000 });
  assert.deepEqual(U.get(s, 2000), { utm_source: 'facebook', utm_medium: 'social', utm_campaign: 'nov' });
});

test('first touch wins: a later tagged landing does not overwrite it', () => {
  const s = mem();
  U.capture('?utm_source=facebook', '/', s, 1000);
  U.capture('?utm_source=youtube&utm_medium=video', '/plan', s, 5000);
  assert.equal(U.get(s, 6000).utm_source, 'facebook');
  assert.equal(U.get(s, 6000).utm_medium, null);
});

test('untagged landings store nothing and do not clear a first touch', () => {
  const s = mem();
  assert.equal(U.capture('', '/', s, 1), null);
  assert.equal(U.capture('?ref=x&utm_term=y', '/', s, 1), null);
  assert.equal(s.getItem(U.KEY), null);
  U.capture('?utm_campaign=only', '/', s, 2);
  U.capture('', '/', s, 3);
  assert.equal(U.get(s, 4).utm_campaign, 'only');
});

test('first touch expires after 90 days, then a new landing can win', () => {
  const s = mem();
  U.capture('?utm_source=facebook', '/', s, 0);
  assert.equal(U.get(s, 89 * DAY).utm_source, 'facebook');
  assert.equal(U.get(s, 91 * DAY), null);
  U.capture('?utm_source=youtube', '/', s, 91 * DAY);
  assert.equal(U.get(s, 92 * DAY).utm_source, 'youtube');
});

test('values are trimmed and cut to 100 characters; junk storage is ignored', () => {
  const s = mem();
  U.capture('?utm_source=' + 'a'.repeat(300) + '&utm_medium=%20%20', '/', s, 1);
  assert.equal(U.get(s, 2).utm_source.length, 100);
  assert.equal(U.get(s, 2).utm_medium, null);
  const bad = mem(); bad.setItem(U.KEY, '{not json');
  assert.equal(U.get(bad, 1), null);
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() {} };
  assert.equal(U.capture('?utm_source=x', '/', throwing, 1), null);
});

test('sync sends the first touch once per user and never throws', async () => {
  const s = mem(); U.capture('?utm_source=qa_test&utm_medium=manual&utm_campaign=qa', '/', s, 1000);
  const calls = [];
  const ok = async (url, init) => { calls.push({ url, init }); return { ok: true }; };
  assert.equal(await U.sync({ access_token: jwt('u1') }, { store: s, fetch: ok, now: 2000 }), true);
  assert.equal(calls[0].url, 'https://tripai-backend.vercel.app/api/user/attribution');
  assert.deepEqual(JSON.parse(calls[0].init.body), { utm: { utm_source: 'qa_test', utm_medium: 'manual', utm_campaign: 'qa' } });
  assert.equal(calls[0].init.headers.Authorization, 'Bearer ' + jwt('u1'));
  assert.equal(await U.sync({ access_token: jwt('u1') }, { store: s, fetch: ok, now: 3000 }), false); // already sent
  assert.equal(await U.sync({ access_token: jwt('u2') }, { store: s, fetch: ok, now: 3000 }), true);  // other user
  assert.equal(calls.length, 2);
  // Failures resolve false and allow a retry.
  const s2 = mem(); U.capture('?utm_source=x', '/', s2, 1);
  assert.equal(await U.sync({ access_token: jwt('u3') }, { store: s2, fetch: async () => { throw new Error('offline'); }, now: 2 }), false);
  assert.equal(await U.sync({ access_token: jwt('u3') }, { store: s2, fetch: async () => ({ ok: false }), now: 2 }), false);
  assert.equal(await U.sync({ access_token: jwt('u3') }, { store: s2, fetch: ok, now: 2 }), true);
  // No session, expired session, or no first touch: nothing sent.
  assert.equal(await U.sync(null, { store: s, fetch: ok }), false);
  assert.equal(await U.sync({ access_token: 'x', expires_at: 1 }, { store: s, fetch: ok, now: 5 }), false);
  assert.equal(await U.sync({ access_token: jwt('u9') }, { store: mem(), fetch: ok }), false);
});

test('every page with analytics also loads the UTM capture, and trip calls send it', () => {
  const pages = ['.', 'blog', 'itineraries', 'plans'].flatMap(d => readdirSync(d).filter(f => f.endsWith('.html')).map(f => d + '/' + f));
  const withAnalytics = pages.filter(p => readFileSync(p, 'utf8').includes('plausible.io/js/script.js'));
  assert.ok(withAnalytics.length >= 40);
  for (const p of withAnalytics) assert.ok(readFileSync(p, 'utf8').includes('<script defer src="/assets/utm.js"></script>'), p);
  assert.ok(readFileSync('scripts/generate-seo-pages.mjs', 'utf8').includes('/assets/utm.js'));
  const plan = readFileSync('plan.html', 'utf8'), trip = readFileSync('trip.html', 'utf8');
  assert.match(plan, /api\/plan\?stream=true[\s\S]{0,400}utm: \(window\.TripvaUtm && TripvaUtm\.get\(\)\)/);
  assert.match(trip, /api\/plan\?stream=true[\s\S]{0,400}utm: \(window\.TripvaUtm && TripvaUtm\.get\(\)\)/);
  assert.match(trip, /trips\/save[\s\S]{0,300}utm: \(window\.TripvaUtm && TripvaUtm\.get\(\)\)/);
});
