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
      assert.ok(dest.searchParams.get('query'), `${f} Klook link has no search words`);
    }
  }
  assert.ok(klook >= 100, `expected 100+ tracked Klook links, got ${klook}`);
});
