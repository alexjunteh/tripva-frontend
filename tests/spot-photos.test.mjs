import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

// The /plan spot picker falls back to the built-in SPOT_DATA list when the AI spots route fails.
// Root cause of blank/logo cards (2026-11-28): those cards guessed a Wikipedia title and fetched
// its lead image at run time. Some titles have no lead image, some lead images are logos or flags,
// and an unrelated refactor once deleted the lookup entirely. Every built-in card now pins a
// hand-checked Wikimedia Commons photo, credited in assets/spots-credits.json; the Wikipedia
// lookup only runs if that pinned photo fails to load.

const html = readFileSync(new URL('../plan.html', import.meta.url), 'utf8');
const credits = JSON.parse(readFileSync(new URL('../assets/spots-credits.json', import.meta.url), 'utf8'));
// Entries use 'single' or "double" quotes (names with apostrophes use double).
const Q = String.raw`(?:'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*")`;
const entries = [...html.matchAll(new RegExp(String.raw`\{name:${Q},wiki:(${Q})[^}]*\}`, 'g'))]
  .map(m => [m[0], m[1].slice(1, -1)]);
const entryLines = (html.match(/^\s*\{name:/gm) || []).length;

test('SPOT_DATA parses into the expected number of built-in spots', () => {
  assert.ok(entries.length >= 190, `only ${entries.length} spot entries found; did the format change?`);
  assert.equal(entries.length, entryLines, 'some {name:...} entries are not parsed, so they escape these checks');
});

test('every built-in spot pins a real Commons photo, not a logo, flag or map', () => {
  for (const m of entries) {
    const title = m[1];
    const url = (m[0].match(/photoUrl:'([^']+)'/) || [])[1];
    assert.ok(url, `${title} has no photoUrl, so its card depends on a run-time Wikipedia guess`);
    assert.match(url, /^https:\/\/(upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/(thumb\/.+\/\d+px-[^/?]+|[0-9a-f]\/[0-9a-f]{2}\/[^/?]+)$/, `${title}: ${url}`);
    assert.doesNotMatch(url, /logo|\.svg|flag|coat_of_arms|map/i, `${title} pins a logo, flag or map`);
  }
});

test('every pinned photo is credited with author and licence', () => {
  for (const m of entries) {
    const title = m[1];
    const url = m[0].match(/photoUrl:'([^']+)'/)?.[1];
    const c = credits[url];
    assert.ok(c, `${title}: its photo has no credit entry`);
    assert.ok(c.artist && c.license, `${title}: credit is missing author or licence`);
    assert.match(c.license, /^(CC|Public domain|PD|Copyrighted free use|GFDL|Attribution|FAL|KOGL Type 1)/i, `${title}: licence ${c.license} is not free`);
  }
});

test('no two built-in cards in one city share a photo', () => {
  const block = html.slice(html.indexOf('const SPOT_DATA'));
  for (const city of block.split(/\n\s*'[^']+'\s*:\s*\[/).slice(1)) {
    const urls = [...city.matchAll(/photoUrl:'([^']+)'/g)].map(m => m[1]);
    assert.equal(new Set(urls).size, urls.length, 'duplicate photo in one city: ' + urls.filter((u, i) => urls.indexOf(u) !== i));
  }
});

test('a pinned photo that fails to load falls back to the Wikipedia lookup before the blank card', () => {
  const fn = html.slice(html.indexOf('function _renderSpotCard'), html.indexOf('function _wikiSpotPhoto'));
  assert.match(fn, /img\.onerror = wikiFallback/, 'a failed photo does not trigger the Wikipedia fallback');
  assert.match(fn, /const wikiFallback = [\s\S]*?_wikiSpotPhoto\(spot\.wiki\)/, 'wikiFallback does not call the Wikipedia lookup');
});

test('the public credits page lists every pinned photo, and the spot picker links to it', () => {
  const page = readFileSync(new URL('../photo-credits.html', import.meta.url), 'utf8');
  for (const c of Object.values(credits)) {
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
    assert.ok(page.includes('>' + esc(c.file) + '</a>') && page.includes(esc(c.license)), `${c.file} missing from photo-credits.html (rerun the credits generator)`);
  }
  assert.match(html, /href="\/photo-credits"/, 'spot picker has no link to the photo credits');
});
