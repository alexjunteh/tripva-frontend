import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../demo-trips.js');
const D = globalThis.window.TripvaDemoTrips;

// A map stop without numeric lat/lng throws "Invalid LatLng" in Leaflet and
// stops every later pin from drawing (seen live on 2026-11-27, demo=tokyo).
test('every demo map stop has numeric coordinates', () => {
  for (const slug of D.slugs) {
    const plan = D.build(slug);
    const stops = (plan.rawPlan || plan).mapStops || [];
    assert.ok(stops.length >= 1, `${slug} has no map stops`);
    for (const s of stops) assert.ok(Number.isFinite(s.lat) && Number.isFinite(s.lng), `${slug} stop "${s.name}" has no coordinates`);
  }
});

test('route map skips stops without coordinates before calling Leaflet', () => {
  const html = readFileSync(new URL('../trip.html', import.meta.url), 'utf8');
  const init = html.slice(html.indexOf('async function initRouteMap'), html.indexOf('ROAM TRIP PLANNER'));
  assert.match(init, /const stops = \(plan\?\.mapStops\|\|\[\]\)\.filter\(s => Number\.isFinite\(\+s\?\.lat\)/);
  assert.match(init, /const route=\(plan\?\.mapRoute\|\|\[\]\)\.filter\(/);
});

// CARTO basemaps serve an "API KEY REQUIRED" watermark on every tile since late 2026.
test('trip map uses keyless OSM tiles with the required credit and labelled pins', () => {
  for (const f of ['../trip.html', '../trip-v2.html']) {
    const html = readFileSync(new URL(f, import.meta.url), 'utf8');
    assert.ok(!html.includes('basemaps.cartocdn.com'), `${f} still uses CARTO tiles`);
    assert.match(html, /tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png/);
    assert.match(html, /openstreetmap\.org\/copyright/);
    assert.ok(!html.includes(">'+s.emoji+'</div>'"), `${f} pins print s.emoji (undefined)`);
  }
});
