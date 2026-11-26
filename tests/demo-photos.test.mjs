import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
require('../demo-trips.js');
const D = globalThis.window.TripvaDemoTrips;
const root = new URL('..', import.meta.url).pathname;
const credits = JSON.parse(readFileSync(root + 'assets/demos/CREDITS.json', 'utf8')).photos.map(p => p.file);

test('every demo gallery photo is the place its caption names, exists, and is credited', () => {
  for (const slug of D.slugs) {
    const plan = D.build(slug);
    const days = (plan.rawPlan || plan).days;
    const seen = new Set();
    days.forEach((d, i) => {
      assert.equal(d.photos.length, 3, `${slug} day ${i + 1}`);
      d.photos.forEach((p, k) => {
        assert.equal(p.url, `assets/demos/${slug}-d${i}-${k}.webp`, `${slug} day ${i + 1}: ${p.caption}`);
        assert.equal(p.caption, d.highlights[k]);
        assert.ok(existsSync(root + p.url), `missing ${p.url}`);
        assert.ok(credits.includes(p.url.split('/').pop()), `no credit for ${p.url}`);
        assert.ok(!seen.has(p.url), `${slug} reuses ${p.url}`);
        seen.add(p.url);
      });
      for (const t of d.timeline.filter(t => t.imageUrl)) {
        const k = d.highlights.findIndex(h => t.title === h || t.title === `${h} photo stop`);
        assert.ok(k >= 0, `${slug} timeline image on "${t.title}" has no matching stop`);
        assert.equal(t.imageUrl, d.photos[k].url, `${slug} timeline "${t.title}" shows another place`);
      }
    });
  }
});
