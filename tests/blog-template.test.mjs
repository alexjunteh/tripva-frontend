import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
// The content-agent template must start new posts from the live, tracked link pattern.
const PATH = 'docs/blog-post-template.html';
const tpl = existsSync(PATH) ? readFileSync(PATH, 'utf8') : '';
const hrefs = [...tpl.matchAll(/href="([^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));

test('template exists and names no closed or dead tour/hotel partner', () => {
  assert.ok(tpl.length > 0, `${PATH} missing or empty`);
  assert.ok(!/getyourguide|hotellook|gyg_url/i.test(tpl), 'template still names GetYourGuide/Hotellook');
});

test('529721 is used only as the Travelpayouts project number (trs), never as a marker or partner id', () => {
  const uses = [...tpl.matchAll(/([a-z_]+)=529721/gi)].map(m => m[1]);
  assert.ok(uses.length > 0, 'no tracked links found');
  assert.deepEqual([...new Set(uses)], ['trs']);
  assert.ok(!/(marker|aff_id|a_aid|partner_id)=(?!729092)\d+/.test(tpl), 'a partner parameter is not 729092');
});

test('every tracked link is a valid Klook link through Travelpayouts with partner 729092', () => {
  const tracked = hrefs.filter(h => h.startsWith('https://tp.media/'));
  assert.ok(tracked.length >= 4, `expected hotel, tour and combined examples, got ${tracked.length}`);
  let hotel = 0, search = 0;
  for (const h of tracked) {
    const u = new URL(h);
    assert.equal(u.searchParams.get('campaign_id'), '137', h);
    assert.equal(u.searchParams.get('marker'), '729092', h);
    assert.equal(u.searchParams.get('trs'), '529721', h);
    assert.equal(u.searchParams.get('p'), '4110', h);
    const dest = new URL(u.searchParams.get('u'));
    assert.equal(dest.hostname, 'www.klook.com', h);
    if (/^\/en-US\/(hotels\/city\/\d+-[a-z-]+-hotels|destination\/c\d+-[a-z-]+\/3-hotel)\/$/.test(dest.pathname)) hotel++;
    else if (dest.pathname === '/en-US/search/result/' && dest.searchParams.get('query')) search++;
    else assert.fail(`not a Klook hotel page or search: ${h}`);
  }
  assert.ok(hotel >= 1 && search >= 1, `need hotel and tour examples (hotel=${hotel}, search=${search})`);
});

test('the city table lists 24 Klook hotel paths in the hotel-page form', () => {
  const rows = [...tpl.matchAll(/^\s{6}([a-z][a-z ]+?)\s{2,}((?:hotels%2Fcity%2F\d+-[a-z-]+-hotels|destination%2Fc\d+-[a-z-]+%2F3-hotel)%2F)$/gm)];
  assert.equal(rows.length, 24, `expected 24 city rows, got ${rows.length}`);
  for (const [, city, path] of rows) {
    const dest = new URL('https://www.klook.com/en-US/' + decodeURIComponent(path));
    assert.match(dest.pathname, /^\/en-US\/(hotels\/city\/\d+-[a-z-]+-hotels|destination\/c\d+-[a-z-]+\/3-hotel)\/$/, city);
  }
});

test('template stays hidden from Google: noindex header, not in sitemap, keeps extensionless canonical', () => {
  assert.match(readFileSync('_headers', 'utf8'), /\/docs\/blog-post-template\*\s*\n\s*X-Robots-Tag: noindex/);
  assert.ok(!readFileSync('sitemap.xml', 'utf8').includes('blog-post-template'));
  assert.match(tpl, /<link rel="canonical" href="https:\/\/tripva\.app\/blog\/\{\{SLUG\}\}">/);
  assert.match(tpl, /<meta property="og:url" content="https:\/\/tripva\.app\/blog\/\{\{SLUG\}\}">/);
});
