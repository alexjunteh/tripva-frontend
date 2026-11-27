// Regression: a real day photo swapped in while a placeholder is still being
// probed (or before the staggered placeholder paint fires) must not be painted
// over. Seen after Copy trip: days 3-9 showed repeated stock photos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const html = readFileSync(new URL('../trip.html', import.meta.url), 'utf8');
const start = html.indexOf('function probeHeroBg(el, idx) {');
let depth = 0, end = start;
for (let i = html.indexOf('{', start); i < html.length; i++) { if (html[i] === '{') depth++; else if (html[i] === '}' && --depth === 0) { end = i + 1; break; } }
function load() {
  const timers = []; const images = [];
  class FakeImage { set src(v) { this._src = v; images.push(this); } get src() { return this._src; } }
  const fn = new Function('Image', 'setTimeout', html.slice(start, end) + '; return probeHeroBg;')(FakeImage, (f, ms) => timers.push({ f, ms }));
  return { fn, timers, images };
}
test('probe timeout does not replace a photo swapped in meanwhile', () => {
  const { fn, timers } = load(); const el = { style: { backgroundImage: "url('https://images.unsplash.com/photo-1')" } };
  fn(el, 2); el.style.backgroundImage = "url('https://upload.wikimedia.org/real.jpg')";
  timers.filter(t => t.ms === 10000).forEach(t => t.f());
  assert.equal(el.style.backgroundImage, "url('https://upload.wikimedia.org/real.jpg')");
});
test('probe error path does not replace a photo swapped in meanwhile', () => {
  const { fn, timers, images } = load(); const el = { style: { backgroundImage: "url('https://images.unsplash.com/photo-1')" } };
  fn(el, 2); el.style.backgroundImage = "url('https://upload.wikimedia.org/real.jpg')";
  images[0].onerror(); timers.filter(t => t.ms === 1500).forEach(t => t.f()); images[1].onerror();
  assert.equal(el.style.backgroundImage, "url('https://upload.wikimedia.org/real.jpg')");
});
test('probe still falls back to a gradient when nothing better arrived', () => {
  const { fn, timers } = load(); const el = { style: { backgroundImage: "url('https://images.unsplash.com/photo-1')" } };
  fn(el, 2); timers.filter(t => t.ms === 10000).forEach(t => t.f());
  assert.match(el.style.backgroundImage, /linear-gradient/);
});
test('staggered day-card placeholder paint skips cards that already have a photo', () => {
  const line = html.split('\n').find(l => l.includes('heroEl.style.backgroundImage = `url(\'${imgUrl}\')`') && l.includes('i * 150'));
  assert.ok(line, 'staggered paint line present');
  assert.match(line, /if \(heroEl\.style\.backgroundImage\) return;/);
});
