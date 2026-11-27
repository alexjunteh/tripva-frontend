// Affiliate click tracking (27 Nov 2026): every tracked blog link names its post
// in sub_id so Travelpayouts reports clicks per post, and every page with
// partner links loads the shared click ping.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const blogs = fs.readdirSync(path.join(ROOT, 'blog')).filter(f => f.endsWith('.html'));
const PARTNER_HOST = /href="https:\/\/(tp\.media|rail\.ninja|12go\.asia|www\.booking\.com|www\.discovercars\.com|www\.kiwi\.com)/;

test('every tracked blog link carries sub_id=blog-<its own slug>', () => {
  let n = 0;
  for (const f of blogs) {
    const slug = f.replace(/\.html$/, '');
    const hrefs = [...read('blog/' + f).matchAll(/href="(https:\/\/tp\.media\/r\?[^"]+)"/g)].map(m => m[1].replace(/&amp;/g, '&'));
    for (const h of hrefs) {
      n++;
      assert.equal(new URL(h).searchParams.get('sub_id'), ('blog-' + slug).slice(0, 60), `${f}: ${h}`);
    }
  }
  assert.ok(n >= 100, `expected the blog's tracked links, found ${n}`);
});

test('template links carry the slug placeholder', () => {
  const t = read('docs/blog-post-template.html');
  const tracked = [...t.matchAll(/href="(https:\/\/tp\.media\/r\?[^"]+)"/g)];
  assert.ok(tracked.length >= 4);
  for (const m of tracked) assert.match(m[1], /sub_id=blog-\{\{SLUG\}\}&amp;trs=/);
  assert.match(t, /\/assets\/click-track\.js/);
});

test('every page with partner links loads the click ping once', () => {
  const pages = [...blogs.map(f => 'blog/' + f), 'trip.html', 'plan.html'];
  for (const f of pages) {
    const s = read(f);
    if (!PARTNER_HOST.test(s) && !/trackAffiliateClick|tp\.media/.test(s)) continue;
    assert.equal((s.match(/<script defer src="\/assets\/click-track\.js[^"]*"><\/script>/g) || []).length, 1, f);
  }
});

function loadPinger(pathname, search = '') {
  const sent = [];
  const listeners = {};
  const ctx = {
    window: {}, location: { href: 'https://tripva.app' + pathname + search, pathname, search },
    URL, URLSearchParams, JSON, Date, String,
    navigator: { sendBeacon: (u, b) => { sent.push({ u, b: JSON.parse(b) }); return true; } },
    document: { addEventListener: (t, fn) => { listeners[t] = fn; }, querySelector: () => null },
    fetch: () => Promise.resolve(),
  };
  vm.runInNewContext(read('assets/click-track.js'), ctx);
  const click = (href, { onclick = '', type = 'click', button = 0, dataset = {} } = {}) => {
    const a = { href: new URL(href, ctx.location.href).href, dataset, getAttribute: k => (k === 'href' ? href : k === 'onclick' ? onclick : null) };
    listeners[type]({ type, button, target: { closest: () => a } });
  };
  return { sent, click, partnerFor: ctx.window.__tripvaPartnerFor };
}

test('ping names the brand behind tp.media and the blog post', () => {
  const p = loadPinger('/blog/best-hotels-tokyo');
  p.click('https://tp.media/r?campaign_id=137&marker=729092&p=4110&sub_id=blog-best-hotels-tokyo&trs=529721&u=https%3A%2F%2Fwww.klook.com%2Fen-US%2F');
  assert.equal(p.sent.length, 1);
  assert.equal(p.sent[0].u, 'https://tripai-backend.vercel.app/api/track');
  assert.deepEqual({ partner: p.sent[0].b.partner, tripId: p.sent[0].b.tripId }, { partner: 'klook', tripId: 'blog:best-hotels-tokyo' });
});

test('ping skips internal links, double clicks and links trip.html already counts', () => {
  const p = loadPinger('/trip', '?id=abc123');
  p.click('/blog/best-hotels-tokyo');
  p.click('https://commons.wikimedia.org/wiki/File:x.jpg');
  p.click('https://www.discovercars.com/?a_aid=729092', { onclick: "trackAffiliateClick('discovercars')" });
  p.click('https://rail.ninja/?marker=729092');
  p.click('https://rail.ninja/?marker=729092');
  p.click('https://12go.asia/en', { type: 'auxclick', button: 2 });
  assert.equal(p.sent.length, 1);
  assert.deepEqual({ partner: p.sent[0].b.partner, tripId: p.sent[0].b.tripId }, { partner: 'railninja', tripId: 'abc123' });
  assert.equal(p.partnerFor('https://www.booking.com/searchresults.html?ss=Zermatt'), 'booking');
  assert.equal(p.partnerFor('https://tripva.app/plan'), '');
});
