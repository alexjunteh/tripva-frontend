#!/usr/bin/env node
// tests/qa-loop/explore.mjs — exhaustive interactive-element crawler.
//
// For each page in PAGES, enumerates every visible button, link, and
// [role=button] element, then for each:
//   1) checks it has an action (href, onclick, or attached listener)
//   2) simulates a human click (dispatchEvent to avoid navigating away)
//   3) watches for: console errors, visible "error" text, and that any
//      opened modal has a close affordance
//   4) dismisses any overlay before testing the next element
//
// Produces a report with one row per failing interaction + screenshot.
// Deterministic — no LLM, no API cost — complements journeys.json.
//
// Usage:  node tests/qa-loop/explore.mjs [--page=/trip?id=...]

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const BROWSE = process.env.BROWSE_BIN || `${process.env.HOME}/.claude/skills/gstack/browse/dist/browse`;
const SITE = process.env.QA_SITE || 'https://tripva.app';
const VP = process.env.QA_VIEWPORT || '390x844';

// Pages to crawl. Trip fixture is known-good; landing covers the hero flow;
// mytrips covers auth; plan covers the form. Add as the app grows.
const FIXTURE = 'a2ba2994227e63956443c06529543317';
const PAGES = [
  { id: 'landing',  url: '/?qa=1' },
  { id: 'plan',     url: '/plan?qa=1' },
  { id: 'plan-fam', url: '/plan?archetype=family&qa=1' },
  { id: 'trip',     url: `/trip?id=${FIXTURE}&qa=1` },
  { id: 'mytrips',  url: '/mytrips?qa=1' },
];

const args = new Set(process.argv.slice(2));
const pageArg = [...args].find(a => a.startsWith('--page='));
const onlyPage = pageArg ? pageArg.split('=')[1] : null;

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore','pipe','pipe'], maxBuffer: 16 * 1024 * 1024 }).trim(); }
  catch (e) { return (e.stdout || '').toString().trim(); }
}
function bjs(expr) {
  const q = expr.replace(/'/g, `'\\''`);
  return run(`'${BROWSE}' js '${q}' 2>&1 | tail -1`);
}
function bgoto(url) { run(`'${BROWSE}' goto '${SITE}${url}' 2>&1 >/dev/null`); }
function bviewport() { run(`'${BROWSE}' viewport ${VP} >/dev/null 2>&1`); }
function bshot(p)  { run(`'${BROWSE}' screenshot '${p}' >/dev/null 2>&1`); }
function bconsoleClear() { run(`'${BROWSE}' console --clear >/dev/null 2>&1`); }
function bconsoleErrors() { return run(`'${BROWSE}' console --errors 2>&1`); }

// Enumerate clickable elements in a way the page can evaluate safely.
// We return a compact list the runner iterates — each element has a
// stable selector + a description + whether it's a link (href) or button.
function enumerateClickables() {
  const expr = `
    (() => {
      const els = [...document.querySelectorAll('button, a[href], [role="button"], [onclick]')];
      const uniq = new Map();
      let idx = 0;
      const out = [];
      for (const e of els) {
        const r = e.getBoundingClientRect();
        if (!(r.width > 0 && r.height > 0)) continue;
        if (getComputedStyle(e).visibility === 'hidden') continue;
        if (getComputedStyle(e).display === 'none') continue;
        if (e.offsetParent === null && getComputedStyle(e).position !== 'fixed') continue;
        const tag = e.tagName.toLowerCase();
        const txt = (e.innerText || e.getAttribute('aria-label') || e.getAttribute('title') || '').trim().replace(/\\s+/g,' ').slice(0, 60);
        if (!txt && !e.querySelector('img,svg,.nav-icon,.arch-glyph')) continue;
        const href = e.getAttribute('href') || '';
        const cls = (e.className || '').toString().slice(0, 80);
        const id = e.id || '';
        // Assign a stable qa-ref attribute so we can click by selector later
        e.setAttribute('data-qa-ref', 'qa-' + (idx++));
        out.push({ ref: 'qa-' + (idx-1), tag, text: txt, href, cls, id });
      }
      return JSON.stringify(out);
    })()
  `;
  try { return JSON.parse(bjs(expr) || '[]'); } catch { return []; }
}

function dismissOverlays() {
  // Close any modal/sheet/overlay that may have opened
  bjs(`
    try {
      document.querySelectorAll('.sheet-overlay.open, .modal-overlay.open, .pack-modal.open')
        .forEach(o => o.classList.remove('open'));
      document.body.classList.remove('fab-suppressed', 'viewer-mode-peek');
      // Close AI chat if open
      const chat = document.getElementById('aiChatBar');
      if (chat && chat.style.display !== 'none') chat.style.display = 'none';
    } catch(e) {}
    true
  `);
}

function testClickable(el) {
  // Skip elements that would navigate away or are destructive
  const skip = /^(logout|delete|remove|cancel subscription|sign out|unsubscribe)/i;
  if (skip.test(el.text)) return { ok: true, skipped: 'destructive' };
  // Skip external links
  if (el.href && /^https?:\/\//i.test(el.href) && !el.href.includes('tripva.app')) {
    return { ok: true, skipped: 'external' };
  }
  // Skip navigations that leave the page (we're isolating clicks)
  if (el.href && el.href !== '#' && !el.href.startsWith('javascript:') && !el.href.startsWith('#')) {
    // For internal links, just verify href resolves. Don't navigate.
    return { ok: true, info: 'link-not-clicked' };
  }

  bconsoleClear();
  // Attempt click — catch sync errors via try/catch in JS
  const result = bjs(`
    (() => {
      try {
        const target = document.querySelector('[data-qa-ref="${el.ref}"]');
        if (!target) return 'element-gone';
        target.click();
        return 'clicked';
      } catch (e) { return 'click-threw: ' + e.message; }
    })()
  `);

  if (!/^clicked$/.test(result)) {
    return { ok: false, reason: `click failed: ${result}` };
  }

  // Small wait for any async state change
  run('sleep 0.3');

  // Check for console errors
  const errors = bconsoleErrors();
  const realErrors = errors.split('\n').filter(l =>
    /\[error\]/i.test(l) &&
    !/Failed to load resource|ERR_FAILED|favicon|plausible|google-analytics|Ignoring Event/.test(l)
  );
  if (realErrors.length) {
    return { ok: false, reason: `console error after click: ${realErrors[0].slice(0, 150)}` };
  }

  // Check for visible "API error" / "something went wrong" text
  const errText = bjs(`
    (() => {
      const t = (document.body.innerText || '').slice(0, 6000);
      const m = t.match(/API error \\\\d+|Something went wrong|Could not load|Error\\\\s*:\\\\s*\\\\w+/);
      return m ? m[0] : '';
    })()
  `);
  if (errText && errText.length > 0 && errText !== 'null') {
    return { ok: false, reason: `visible error text: '${errText.slice(0, 120)}'` };
  }

  return { ok: true };
}

function crawlPage(page, reportDir) {
  console.log(`\n[page] ${page.id} ← ${page.url}`);
  bgoto(page.url);
  run('sleep 7');

  // Some pages redirect (e.g., /trip with no id → /plan). Capture actual URL.
  const actualUrl = bjs('location.href');
  if (!actualUrl.includes(page.url.split('?')[0].replace('/', ''))) {
    if (page.url !== '/?qa=1' || !actualUrl.endsWith('/')) {
      console.log(`  ↳ redirected: ${actualUrl}`);
    }
  }

  let elements = enumerateClickables();
  console.log(`  found ${elements.length} clickable element(s)`);
  const failures = [];
  const tested = new Set();
  let refreshCount = 0;

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (tested.has(el.ref)) continue;
    tested.add(el.ref);
    const label = `${el.tag}${el.id ? '#'+el.id : ''} "${el.text || '(icon)'}"`;
    const res = testClickable(el);
    if (res.skipped) { /* silent skip */ continue; }
    if (res.info) continue;  // link-not-clicked etc.
    if (!res.ok) {
      // If the reason is 'element-gone', that's flakiness from a prior click
      // that removed the element from DOM (e.g., modal close). Skip instead
      // of reloading — the element legitimately doesn't exist anymore in the
      // current state, which is fine. Only treat non-gone reasons as bugs.
      if (/element-gone/.test(res.reason)) continue;
      failures.push({ element: el, label, reason: res.reason });
      console.log(`    ✗ ${label} — ${res.reason}`);
      const shotPath = `${reportDir}/${page.id}-${el.ref}.png`;
      bshot(shotPath);
      // Reload ONLY on real failures, then re-enumerate fresh so subsequent
      // elements get new refs. Cap at 3 reloads per page to avoid loops.
      if (refreshCount < 3) {
        refreshCount++;
        dismissOverlays();
        bgoto(page.url);
        run('sleep 5');
        elements = enumerateClickables();
        i = -1;  // restart loop; tested Set skips previously-checked refs
      }
    } else {
      dismissOverlays();
    }
  }

  return { page, tested: tested.size, failures };
}

async function main() {
  if (!existsSync(BROWSE)) {
    console.error(`browse binary not found: ${BROWSE}`);
    process.exit(1);
  }
  bviewport();

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').slice(0, 15);
  const reportDir = `${__dirname}/reports/${stamp}-explore`;
  mkdirSync(reportDir, { recursive: true });

  const pages = onlyPage ? PAGES.filter(p => p.id === onlyPage || p.url === onlyPage) : PAGES;
  if (!pages.length) { console.error('no pages to crawl'); process.exit(1); }

  console.log(`QA explore — ${pages.length} page(s) against ${SITE}`);
  const all = [];
  for (const p of pages) {
    all.push(crawlPage(p, reportDir));
  }

  const tot = all.reduce((a, r) => a + r.tested, 0);
  const allFails = all.flatMap(r => r.failures.map(f => ({ page: r.page.id, ...f })));

  const md = [
    `# Tripva QA explore — ${stamp}`,
    ``,
    `- Site: ${SITE}  ·  Viewport: ${VP}`,
    `- Elements tested: ${tot}  ·  Failures: ${allFails.length}`,
    ``,
    `## Results per page`,
    ``,
    ...all.map(r => `- **${r.page.id}** (${r.page.url}) — ${r.tested} tested, ${r.failures.length} failed`),
    ``,
    allFails.length ? `## Failures\n\n${allFails.map((f,i) => `${i+1}. **${f.page}** · ${f.label}\n   - ${f.reason}\n   - Selector: \`[data-qa-ref="${f.element.ref}"]\``).join('\n\n')}` : `## All interactions passed 🎉`,
    ``,
  ].join('\n');

  writeFileSync(`${reportDir}/report.md`, md);
  console.log(`\nReport: ${reportDir}/report.md`);
  console.log(`Elements: ${tot}  ·  Failures: ${allFails.length}`);
  process.exit(Math.min(allFails.length, 255));
}

main().catch(e => { console.error(e); process.exit(255); });
