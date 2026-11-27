// Regression: every blog post told Google to index /blog/x.html, which Cloudflare Pages
// 308-redirects to /blog/x. scripts/check-url-signals.mjs must catch that class of fault.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const SCRIPT = fileURLToPath(new URL('../scripts/check-url-signals.mjs', import.meta.url));
const REPO = fileURLToPath(new URL('..', import.meta.url));

function post(slug, { canonical, og, id, link, extra = '' } = {}) {
  const u = `https://tripva.app/blog/${slug}`;
  return `<!DOCTYPE html><html><head>
<link rel="canonical" href="${canonical ?? u}">
<meta property="og:url" content="${og ?? canonical ?? u}">
<script type="application/ld+json">{"@type":"BlogPosting","mainEntityOfPage":{"@type":"WebPage","@id":"${id ?? u}"},"author":{"url":"https://tripva.app"}}</script>
</head><body><a href="${link ?? '/blog/other'}">x</a>
<a href="https://www.booking.com/city/th/bangkok.html?aid=1" rel="sponsored">hotel</a>${extra}</body></html>`;
}
const SITEMAP = (locs) => `<?xml version="1.0"?><urlset>${locs.map((l) => `<url><loc>${l}</loc></url>`).join('')}</urlset>`;

function site(files) {
  const dir = mkdtempSync(path.join(tmpdir(), 'urlsig-'));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    writeFileSync(path.join(dir, rel), body);
  }
  return dir;
}
const run = (dir, extra = []) => {
  const r = spawnSync(process.execPath, [SCRIPT, '--root', dir, '--json', ...extra], { encoding: 'utf8', timeout: 30000 });
  let out = null;
  try { out = JSON.parse(r.stdout); } catch { /* exit 2 prints plain text */ }
  return { code: r.status, out, stderr: r.stderr };
};
const good = () => ({
  'blog/a.html': post('a'),
  'blog/other.html': post('other'),
  'sitemap.xml': SITEMAP(['https://tripva.app/blog/a', 'https://tripva.app/blog/other']),
});

test('clean site passes, and external .html affiliate links are ignored', () => {
  const dir = site(good());
  const r = run(dir);
  rmSync(dir, { recursive: true });
  assert.equal(r.code, 0, JSON.stringify(r.out));
  assert.equal(r.out.failures.length, 0);
});

test('canonical ending in .html fails', () => {
  const dir = site({ ...good(), 'blog/a.html': post('a', { canonical: 'https://tripva.app/blog/a.html' }) });
  const r = run(dir); rmSync(dir, { recursive: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.failures.some((f) => /canonical ends in \.html/.test(f)));
});

test('canonical with query or casing still caught (.HTML?x=1)', () => {
  const dir = site({ ...good(), 'blog/a.html': post('a', { canonical: 'https://tripva.app/blog/a.HTML?ref=1', og: 'https://tripva.app/blog/a' }) });
  const r = run(dir); rmSync(dir, { recursive: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.failures.some((f) => /canonical ends in \.html/.test(f)));
});

test('canonical pointing at another clean page fails (must be self-referencing)', () => {
  const dir = site({ ...good(), 'blog/a.html': post('a', { canonical: 'https://tripva.app/blog/other' }) });
  const r = run(dir); rmSync(dir, { recursive: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.failures.some((f) => /is not this page's own URL/.test(f)));
});

test('og:url and JSON-LD @id ending in .html fail', () => {
  const dir = site({ ...good(), 'blog/a.html': post('a', { og: 'https://tripva.app/blog/a.html', id: 'https://tripva.app/blog/a.html' }) });
  const r = run(dir); rmSync(dir, { recursive: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.failures.some((f) => /og:url ends in \.html/.test(f)));
  assert.ok(r.out.failures.some((f) => /JSON-LD @id ends in \.html/.test(f)));
});

test('internal blog link to .html fails (root-relative and absolute, with #anchor)', () => {
  const dir = site({ ...good(), 'blog/a.html': post('a', { link: '/plan.html?destination=Rome', extra: '<a href="https://tripva.app/blog/other.html#top">y</a>' }) });
  const r = run(dir); rmSync(dir, { recursive: true });
  assert.equal(r.code, 1);
  assert.equal(r.out.failures.filter((f) => /internal link ends in \.html/.test(f)).length, 2);
});

test('sitemap loc ending in .html fails, and a loc with no page file fails', () => {
  const dir = site({ ...good(), 'sitemap.xml': SITEMAP(['https://tripva.app/blog/a.html', 'https://tripva.app/blog/gone']) });
  const r = run(dir); rmSync(dir, { recursive: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.failures.some((f) => /loc ends in \.html/.test(f)));
  assert.ok(r.out.failures.some((f) => /has no matching page file/.test(f)));
});

test('missing or empty sitemap fails; missing root exits 2', () => {
  const g = good(); delete g['sitemap.xml'];
  let dir = site(g); let r = run(dir); rmSync(dir, { recursive: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.failures.some((f) => /sitemap\.xml: missing/.test(f)));
  dir = site({ ...good(), 'sitemap.xml': '<urlset></urlset>' }); r = run(dir); rmSync(dir, { recursive: true });
  assert.ok(r.out.failures.some((f) => /no <loc> entries/.test(f)));
  r = run(path.join(tmpdir(), 'does-not-exist-urlsig'));
  assert.equal(r.code, 2);
});

test('--live fails on a 308, a 404 and an unreachable server; passes on direct 200s', async () => {
  const pages = { '/blog/a': post('a'), '/blog/other': post('other') };
  let mode = 'good';
  const server = http.createServer((req, res) => {
    if (req.url === '/sitemap.xml') { res.writeHead(200); return res.end(SITEMAP(['https://tripva.app/blog/a', 'https://tripva.app/blog/other'])); }
    if (mode === 'bad' && req.url === '/blog/a') { res.writeHead(308, { location: '/blog/a/' }); return res.end(); }
    if (mode === 'bad' && req.url === '/blog/other') { res.writeHead(404); return res.end(); }
    if (pages[req.url]) { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(pages[req.url]); }
    res.writeHead(404); res.end();
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${server.address().port}`;
  const dir = site(good());
  const runAsync = (extra) => new Promise((ok) => {
    import('node:child_process').then(({ execFile }) => execFile(process.execPath, [SCRIPT, '--root', dir, '--json', ...extra], { timeout: 30000 }, (err, stdout) => ok({ code: err ? err.code : 0, out: JSON.parse(stdout) })));
  });
  try {
    let r = await runAsync(['--live', '--base', base]);
    assert.equal(r.code, 0, JSON.stringify(r.out));
    assert.equal(r.out.stats.live200, 2);
    mode = 'bad';
    r = await runAsync(['--live', '--base', base]);
    assert.equal(r.code, 1);
    assert.ok(r.out.failures.some((f) => /status 308 -> \/blog\/a\//.test(f)));
    assert.ok(r.out.failures.some((f) => /status 404/.test(f)));
  } finally {
    await new Promise((ok) => server.close(ok));
  }
  const r = await runAsync(['--live', '--base', base, '--timeout', '2000']);
  rmSync(dir, { recursive: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.failures.some((f) => /live sitemap\.xml: status 0/.test(f)));
});

test('the blog post template is checked too: a .html canonical in docs/*-template.html fails', () => {
  const dir = site({ ...good(), 'docs/blog-post-template.html': post('{{SLUG}}', { canonical: 'https://tripva.app/blog/{{SLUG}}.html', og: 'https://tripva.app/blog/{{SLUG}}' }) });
  const r = run(dir); rmSync(dir, { recursive: true });
  assert.equal(r.code, 1);
  assert.ok(r.out.failures.some((f) => /^docs\/blog-post-template\.html: canonical ends in \.html/.test(f)));
});

test('the real repo passes the static check', () => {
  const r = run(REPO);
  assert.equal(r.code, 0, r.out ? r.out.failures.slice(0, 10).join('\n') : r.stderr);
  assert.ok(r.out.stats.sitemapLocs >= 48);
});
