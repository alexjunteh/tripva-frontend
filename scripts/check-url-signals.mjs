#!/usr/bin/env node
// check-url-signals — fails when Tripva tells Google to index an address that redirects.
//
// Cloudflare Pages 308-redirects every /x.html to /x. So a canonical, og:url,
// JSON-LD @id/url, sitemap <loc> or internal link written with ".html" points
// Google at a redirect. This script fails on any of those.
//
// Usage:
//   node scripts/check-url-signals.mjs                # static check of the repo files
//   node scripts/check-url-signals.mjs --live         # also fetch https://tripva.app/sitemap.xml,
//                                                     # every <loc> must answer 200 with no redirect
//                                                     # and carry a canonical equal to itself
//   options: --root <dir>   repo root (default: this script's parent dir)
//            --base <url>   where to fetch in --live mode (default https://tripva.app)
//            --origin <url> site origin used in the files (default https://tripva.app)
//            --json         print the result as JSON
// Exit code: 0 = all pass, 1 = at least one failure, 2 = could not run (bad input).

import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : dflt;
};
const ROOT = path.resolve(opt('--root', path.join(path.dirname(fileURLToPath(import.meta.url)), '..')));
const ORIGIN = opt('--origin', 'https://tripva.app').replace(/\/$/, '');
const BASE = opt('--base', ORIGIN).replace(/\/$/, '');
const LIVE = args.includes('--live');
const JSON_OUT = args.includes('--json');
const TIMEOUT_MS = Number(opt('--timeout', '20000'));

const failures = [];
const stats = { files: 0, canonicals: 0, ogUrls: 0, jsonLdUrls: 0, internalLinks: 0, sitemapLocs: 0, liveChecked: 0, live200: 0 };
const fail = (where, msg) => failures.push(`${where}: ${msg}`);

// A URL "ends in .html" when its path (before ? or #) ends in .html.
const endsHtml = (u) => /\.html$/i.test(String(u).split(/[?#]/)[0]);
// Is this URL on our own site (root-relative, relative, or absolute on ORIGIN)?
const HOST = ORIGIN.replace(/^https?:/, ''); // //tripva.app
const isInternal = (u) => {
  if (!u) return false;
  if (u.startsWith(ORIGIN + '/') || u === ORIGIN) return true;
  if (u.startsWith('http://' + HOST.slice(2) + '/') || u.startsWith(HOST + '/')) return true; // http:// or protocol-relative
  if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith('//')) return false; // other scheme or host
  return !u.startsWith('#');
};

// Final public URL of a repo file: blog/x.html -> /blog/x ; blog/index.html -> /blog/ ; index.html -> /
function fileToUrl(rel) {
  const p = rel.split(path.sep).join('/');
  if (p === 'index.html') return ORIGIN + '/';
  if (p.endsWith('/index.html')) return `${ORIGIN}/${p.slice(0, -'index.html'.length)}`;
  return `${ORIGIN}/${p.replace(/\.html$/i, '')}`;
}

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[2] ?? m[3]) : null;
};
const allCanonicals = (html) => [...html.matchAll(/<link\b[^>]*\brel\s*=\s*["']canonical["'][^>]*>/gi)].map((m) => attr(m[0], 'href'));
const allOgUrls = (html) => [...html.matchAll(/<meta\b[^>]*\bproperty\s*=\s*["']og:url["'][^>]*>/gi)].map((m) => attr(m[0], 'content'));
const getCanonical = (html) => allCanonicals(html)[0] ?? null;

// Every "@id" / "url" / "item" string in a JSON-LD block. Decodes the JSON when it parses
// (so escaped slashes like https:\/\/… are seen as URLs); falls back to a regex that unescapes \/.
function jsonLdUrls(src) {
  const out = [];
  const walk = (v) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === 'object') {
      for (const [k, x] of Object.entries(v)) {
        if ((k === '@id' || k === 'url' || k === 'item') && typeof x === 'string') out.push([k, x]);
        else walk(x);
      }
    }
  };
  try {
    walk(JSON.parse(src));
  } catch {
    for (const m of src.matchAll(/"(@id|url|item)"\s*:\s*"((?:[^"\\]|\\.)+)"/g)) out.push([m[1], m[2].replace(/\\\//g, '/')]);
  }
  return out;
}

function checkHtml(rel, html, { checkLinks }) {
  const where = rel.split(path.sep).join('/');
  const isTemplate = /(^_|-template\.html$)/.test(path.basename(rel));
  const canonicals = allCanonicals(html);
  if (canonicals.length > 1) fail(where, `${canonicals.length} canonical tags (must be exactly one)`);
  const canonical = canonicals[0] ?? null;
  for (const c of canonicals) {
    stats.canonicals++;
    if (endsHtml(c)) fail(where, `canonical ends in .html (${c})`);
    else if (!isTemplate && c !== fileToUrl(rel)) fail(where, `canonical ${c} is not this page's own URL ${fileToUrl(rel)}`);
  }
  for (const og of allOgUrls(html)) {
    stats.ogUrls++;
    if (endsHtml(og)) fail(where, `og:url ends in .html (${og})`);
    if (canonical && og !== canonical) fail(where, `og:url ${og} differs from canonical ${canonical}`);
  }
  for (const block of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    for (const [key, u] of jsonLdUrls(block[1])) {
      if (!isInternal(u)) continue;
      stats.jsonLdUrls++;
      if (endsHtml(u)) fail(where, `JSON-LD ${key} ends in .html (${u})`);
    }
  }
  if (checkLinks) {
    for (const m of html.matchAll(/<a\b[^>]*>/gi)) {
      const href = attr(m[0], 'href');
      if (!href || !isInternal(href)) continue;
      stats.internalLinks++;
      if (endsHtml(href)) fail(where, `internal link ends in .html (${href})`);
    }
  }
}

async function listHtml(dir) {
  try {
    return (await readdir(path.join(ROOT, dir))).filter((f) => f.endsWith('.html')).map((f) => path.join(dir, f));
  } catch (e) {
    if (e.code === 'ENOENT') return [];
    throw e;
  }
}

function parseLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
}

async function fetchNoRedirect(url) {
  try {
    const res = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'tripva-check-url-signals/1.0' } });
    const body = res.status === 200 ? await res.text() : '';
    return { status: res.status, location: res.headers.get('location'), body };
  } catch (e) {
    return { status: 0, error: e.name === 'TimeoutError' ? `timeout after ${TIMEOUT_MS} ms` : e.message };
  }
}

async function main() {
  try {
    await stat(ROOT);
  } catch {
    console.error(`root not found: ${ROOT}`);
    process.exit(2);
  }

  // 1. Pages: blog posts + index + template (links too), itinerary pages, top-level pages.
  const blog = await listHtml('blog');
  const itin = await listHtml('itineraries');
  const top = await listHtml('.');
  // The blog post template new posts are copied from (docs/*-template.html): same rules as a post.
  const templates = (await listHtml('docs')).filter((f) => f.endsWith('-template.html'));
  for (const rel of [...blog, ...itin, ...top, ...templates]) {
    const html = await readFile(path.join(ROOT, rel), 'utf8');
    stats.files++;
    checkHtml(rel, html, { checkLinks: rel.startsWith('blog' + path.sep) || templates.includes(rel) });
  }

  // 2. Sitemap: every <loc> clean, and every loc maps to a file in the repo.
  let xml;
  try {
    xml = await readFile(path.join(ROOT, 'sitemap.xml'), 'utf8');
  } catch {
    fail('sitemap.xml', 'missing');
  }
  const locs = xml ? parseLocs(xml) : [];
  if (xml && locs.length === 0) fail('sitemap.xml', 'has no <loc> entries');
  const fileUrls = new Set([...blog, ...itin, ...top].map(fileToUrl));
  for (const loc of locs) {
    stats.sitemapLocs++;
    if (endsHtml(loc)) fail('sitemap.xml', `loc ends in .html (${loc})`);
    else if (!fileUrls.has(loc)) fail('sitemap.xml', `loc ${loc} has no matching page file in the repo`);
  }

  // 3. Live: fetch the deployed sitemap; each loc must be 200 directly and self-canonical.
  if (LIVE) {
    const sm = await fetchNoRedirect(`${BASE}/sitemap.xml`);
    if (sm.status !== 200) fail('live sitemap.xml', `status ${sm.status}${sm.error ? ' ' + sm.error : ''}`);
    const deployedLocs = sm.status === 200 ? parseLocs(sm.body) : [];
    if (sm.status === 200 && deployedLocs.length === 0) fail('live sitemap.xml', 'has no <loc> entries');
    // Probe the deployed sitemap AND the repo's sitemap, so a repo URL that is not live yet is still requested.
    const liveLocs = [...new Set([...deployedLocs, ...locs])];
    for (const loc of liveLocs) {
      const url = loc.startsWith(ORIGIN) ? BASE + loc.slice(ORIGIN.length) : loc;
      const r = await fetchNoRedirect(url);
      stats.liveChecked++;
      if (r.status !== 200) {
        fail(`live ${loc}`, r.status ? `status ${r.status}${r.location ? ' -> ' + r.location : ''}` : `request failed: ${r.error}`);
        continue;
      }
      stats.live200++;
      const c = getCanonical(r.body);
      if (c !== null && c !== loc) fail(`live ${loc}`, `canonical is ${c}, not itself`);
    }
  }

  const ok = failures.length === 0;
  if (JSON_OUT) {
    console.log(JSON.stringify({ ok, stats, failures }, null, 2));
  } else {
    console.log(`check-url-signals: ${ok ? 'PASS' : 'FAIL'}`);
    console.log(`  files ${stats.files} · canonicals ${stats.canonicals} · og:url ${stats.ogUrls} · JSON-LD urls ${stats.jsonLdUrls} · internal blog links ${stats.internalLinks} · sitemap locs ${stats.sitemapLocs}`);
    if (LIVE) console.log(`  live: ${stats.live200}/${stats.liveChecked} sitemap URLs (deployed + repo sitemap) answered 200 with no redirect (${BASE})`);
    if (!ok) {
      console.log(`  ${failures.length} failure(s):`);
      for (const f of failures.slice(0, 60)) console.log('   - ' + f);
      if (failures.length > 60) console.log(`   … and ${failures.length - 60} more`);
    }
  }
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error('check-url-signals crashed:', e);
  process.exit(2);
});
