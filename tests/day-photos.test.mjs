import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const P = require('../day-photos.js');

const TOKYO = { name: 'Tokyo', lat: 35.6896, lng: 139.7006, day: 1, nights: 3 };
const HAKONE = { name: 'Hakone', lat: 35.2325, lng: 139.1069, day: 5, nights: 2 };
const KYOTO = { name: 'Kyoto', lat: 35.0116, lng: 135.7681, day: 7, nights: 2 };
const plan = { mapStops: [KYOTO, TOKYO, HAKONE] };

const page = (index, title, lat, lon, file = `${title.replace(/\W+/g, '_')}.jpg`, width = 1280) => ({
  index, title,
  coordinates: lat == null ? undefined : [{ lat, lon }],
  thumbnail: { source: `https://upload.wikimedia.org/x/${width}px-${file}?utm_source=en.wikipedia.org`, width },
});
const resp = (...pages) => ({ query: { pages: Object.fromEntries(pages.map((p, i) => [String(i), p])) } });
const center = s => ({ lat: s.lat, lng: s.lng });

test('stopForDay follows the itinerary and honours a stop named by heroSeed', () => {
  assert.equal(P.stopForDay(plan, 2).name, 'Tokyo');
  assert.equal(P.stopForDay(plan, 6).name, 'Hakone');
  assert.equal(P.stopForDay(plan, 9).name, 'Kyoto');
  assert.equal(P.stopForDay(plan, 9, 'tokyo').name, 'Tokyo', '"Return to Tokyo" day uses Tokyo');
  assert.equal(P.stopForDay({ mapStops: [] }, 1), null);
});

test('rejects a page in another city or country (the Buffalo, New York bug)', () => {
  const r = resp(page(1, 'Buffalo, New York', 42.89, -78.88), page(2, 'Kyoto', 35.0116, 135.7681));
  assert.equal(P.pickFromResponse(r, center(TOKYO), new Set(), 'New York Bar'), null);
});

test('accepts a page near the day stop', () => {
  const r = resp(page(1, 'Asakusa', 35.7148, 139.7967));
  assert.equal(P.pickFromResponse(r, center(TOKYO), new Set(), 'asakusa Tokyo').title, 'Asakusa');
});

test('skips disaster/institution articles, maps, svg and small images', () => {
  const r = resp(
    page(1, 'Notre-Dame fire', 48.853, 2.35),
    page(2, 'Diocese of Paris', 48.853, 2.35),
    page(3, 'Paris locator', 48.85, 2.35, 'Paris_location_map.png'),
    page(4, 'Paris flag', 48.85, 2.35, 'Flag_of_Paris.svg.png'),
    page(5, 'Paris small', 48.85, 2.35, 'Small.jpg', 640),
    page(6, 'Notre-Dame de Paris', 48.853, 2.3499),
  );
  assert.equal(P.pickFromResponse(r, { lat: 48.8566, lng: 2.3522 }, new Set(), 'Notre Dame').title, 'Notre-Dame de Paris');
});

test('prefers a page whose title matches the query, and never reuses a photo', () => {
  const r = resp(page(1, 'Port of Auckland', -36.84, 174.77), page(2, 'Rotorua', -38.14, 176.25));
  const near = { lat: -38.1368, lng: 176.2497 };
  assert.equal(P.pickFromResponse(r, near, new Set(), 'rotorua Rotorua').title, 'Rotorua');
  const used = new Set([r.query.pages['1'].thumbnail.source]);
  assert.equal(P.pickFromResponse(r, near, used, 'rotorua Rotorua'), null);
});

test('seedsForDay pulls place names out of day titles', () => {
  const seeds = P.seedsForDay({ title: 'Views from Victoria Peak' }, { name: 'Hong Kong' });
  assert.equal(seeds[0], 'Victoria Peak Hong Kong');
  assert.ok(seeds.includes('Victoria Peak'));
  const s2 = P.seedsForDay({ heroSeed: 'asakusa', title: 'Asakusa and Skytree Views' }, TOKYO);
  assert.equal(s2[0], 'asakusa Tokyo');
});

test('pickDayPhoto returns null without stops, caps queries, and surfaces fetch errors', async () => {
  let calls = 0;
  const fetchJson = async () => { calls++; return resp(page(1, 'Somewhere far', 0, 0)); };
  assert.equal(await P.pickDayPhoto({ mapStops: [] }, { day: 1, title: 'X' }, new Set(), fetchJson), null);
  assert.equal(calls, 0, 'no stops means no network calls');
  const day = { day: 1, heroSeed: 'a', title: 'Alpha Bravo Charlie Delta Echo Foxtrot Golf' };
  assert.equal(await P.pickDayPhoto(plan, day, new Set(), fetchJson), null);
  assert.ok(calls <= 5, `at most 5 searches per day, got ${calls}`);
  const failing = async () => { throw new Error('429'); };
  await assert.rejects(P.pickDayPhoto(plan, { day: 1, heroSeed: 'shibuya' }, new Set(), failing), /429/,
    'errors surface so the page stops searching instead of hammering a rate-limited API');
  const ok = async () => resp(page(1, 'Shibuya', 35.6618, 139.7041));
  const used = new Set();
  const hit = await P.pickDayPhoto(plan, { day: 1, heroSeed: 'shibuya' }, used, ok);
  assert.equal(hit.title, 'Shibuya');
  assert.ok(used.has(hit.url));
});

test('hotel stop names give the town, and the country disambiguates common names', () => {
  assert.equal(P.placeName({ name: 'Rua Rasada Hotel, Trang' }), 'Trang');
  assert.equal(P.placeName({ name: 'Karon / Kata / Rawai' }), 'Karon');
  assert.equal(P.countryOf({ trip: { destination: 'Mahé, Praslin & La Digue, Seychelles' } }), 'Seychelles');
  assert.equal(P.countryOf({ trip: { destination: 'Tokyo' } }), '');
  const seeds = P.seedsForDay({ heroSeed: 'victoria', title: 'Arrival in Victoria' }, { name: 'Victoria' }, 'Seychelles');
  assert.ok(seeds.slice(0, 5).includes('Victoria Seychelles'), seeds.join(' | '));
  const th = P.seedsForDay({ heroSeed: 'trang-thailand-town-evening', title: 'Trang Arrival and Group Dinner' }, { name: 'Rua Rasada Hotel, Trang' }, 'Thailand');
  assert.ok(th.slice(0, 5).includes('Trang Thailand'), th.join(' | '));
  assert.ok(!th.some(q => /Rasada/.test(q)), 'hotel names never become searches');
});

test('a nearby page with an unrelated title is not used (Beau Vallon day got La Digue)', () => {
  const beau = { lat: -4.5, lng: 55.45 };
  const r = resp(page(1, 'La Digue', -4.359, 55.84), page(2, 'Beau Vallon, Seychelles', -4.61, 55.43));
  assert.equal(P.pickFromResponse(r, beau, new Set(), 'Beau Vallon Seychelles').title, 'Beau Vallon, Seychelles');
  assert.equal(P.pickFromResponse(resp(page(1, 'La Digue', -4.359, 55.84)), beau, new Set(), 'Beau Vallon Seychelles'), null);
  assert.equal(P.pickFromResponse(resp(page(1, 'Mahé, Seychelles', -4.68, 55.48)), beau, new Set(), 'mahe Victoria').title, 'Mahé, Seychelles', 'accents do not block a match');
});

test('seedsForDay searches the landmark named in the highlights before a bare heroSeed', () => {
  // Real plan, 28 Nov 2026: heroSeed "fushimi" alone found Fushimi Castle for a Fushimi Inari day.
  const KYOTO = { name: 'Kyoto', lat: 35.0116, lng: 135.7681 };
  const day = { heroSeed: 'fushimi', title: 'Temples and Traditional Flavours of Kyoto',
    highlights: ['Fushimi Inari torii gates at sunrise', 'Gion evening stroll', 'Kaiseki dinner'] };
  const seeds = P.seedsForDay(day, KYOTO, 'Japan');
  assert.equal(seeds[0], 'Fushimi Inari', seeds.join(' | '));
  assert.ok(seeds.indexOf('Fushimi Inari') < seeds.indexOf('fushimi Kyoto'), seeds.join(' | '));
  assert.ok(seeds.slice(0, 5).includes('fushimi Kyoto'), 'heroSeed still searched: ' + seeds.join(' | '));
  assert.ok(!seeds.some(q => /dinner|sunrise|stroll/i.test(q)), 'filler words never become searches');
});

test('seedsForDay ignores lowercase-only and missing highlights', () => {
  const s = P.seedsForDay({ heroSeed: 'asakusa', title: 'Asakusa', highlights: ['street food crawl'] }, TOKYO);
  assert.equal(s[0], 'asakusa Tokyo');
});

test('seedsForDay never turns a sentence-initial capital in a highlight into a search', () => {
  // Real saved trip: "Cultural immersion" became "Cultural Prophet's Mosque" -> Quba Mosque.
  const stop = { name: "Prophet's Mosque", lat: 24.4672, lng: 39.6111 };
  const s = P.seedsForDay({ heroSeed: 'medina', title: 'Arrival in Medina', highlights: ["Prophet's Mosque", 'Cultural immersion'] }, stop, 'Saudi Arabia');
  assert.ok(!s.some(q => /^Cultural/.test(q)), s.join(' | '));
  assert.equal(s[0], "medina Prophet's Mosque", s.join(' | '));
});

test('title match is whole-word: "port" does not match "Important Bird Area"', () => {
  const r = { query: { pages: {
    1: { index: 1, title: 'Mahé highlands and surrounding areas Important Bird Area', thumbnail: { source: 'https://x/a.jpg', width: 1280 }, coordinates: [{ lat: -4.65, lon: 55.45 }] },
    2: { index: 2, title: 'Port Launay Marine National Park', thumbnail: { source: 'https://x/b.jpg', width: 1280 }, coordinates: [{ lat: -4.65, lon: 55.39 }] },
  } } };
  assert.equal(P.pickFromResponse(r, { lat: -4.62, lng: 55.45 }, new Set(), 'Port Launay Marine National Park').title, 'Port Launay Marine National Park');
  // A joined seed still matches the spaced title.
  assert.equal(P.pickFromResponse(r, { lat: -4.62, lng: 55.45 }, new Set(), 'portlaunay').title, 'Port Launay Marine National Park');
});
