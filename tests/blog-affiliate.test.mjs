import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
const posts = readdirSync('blog').filter(f => f.endsWith('.html'));
test('blog tour links are tracked Klook links, not untracked GetYourGuide', () => {
  let klook = 0;
  for (const f of posts) {
    const s = readFileSync('blog/' + f, 'utf8');
    assert.ok(!/getyourguide/i.test(s), `${f} still links/mentions GetYourGuide (not open to Tripva on Travelpayouts)`);
    for (const m of s.matchAll(/href="(https:\/\/tp\.media\/r\?[^"]+)"/g)) {
      const u = new URL(m[1].replace(/&amp;/g, '&'));
      if (u.searchParams.get('campaign_id') !== '137') continue;
      klook++;
      assert.equal(u.searchParams.get('marker'), '729092', f);
      assert.equal(u.searchParams.get('trs'), '529721', f);
      const dest = new URL(u.searchParams.get('u'));
      assert.equal(dest.hostname, 'www.klook.com', f);
      const hotelPage = /^\/en-US\/(hotels\/city\/\d+-[a-z-]+-hotels|destination\/c\d+-[a-z-]+\/3-hotel)\/$/.test(dest.pathname);
      assert.ok(hotelPage || dest.searchParams.get('query'), `${f} Klook link is neither a search nor a hotel city page`);
    }
  }
  assert.ok(klook >= 100, `expected 100+ tracked Klook links, got ${klook}`);
});

test('blog hotel links: covered cities use tracked Klook hotel pages, no dead Hotellook', () => {
  let klookHotels = 0;
  for (const f of posts) {
    const s = readFileSync('blog/' + f, 'utf8');
    assert.ok(!/hotellook/i.test(s), `${f} still mentions Hotellook (dead host)`);
    klookHotels += (s.match(/klook\.com%2Fen-US%2F(hotels%2Fcity|destination%2Fc\d+-[a-z-]+%2F3-hotel)/g) || []).length;
    for (const m of s.matchAll(/booking\.com\/searchresults\.html\?ss=(Tokyo|Kyoto|Bangkok|Bali|Lisbon|Dubai|Barcelona)&/g))
      assert.fail(`${f} links ${m[1]} hotels to Booking.com instead of Klook`);
  }
  assert.ok(klookHotels >= 70, `expected 70+ Klook hotel links, got ${klookHotels}`);
});
