#!/usr/bin/env node
// tests/qa-loop/run.mjs — Tripva user-journey simulator.
//
// Reads journeys.json, executes each step via the gstack `browse` binary
// (Playwright under the hood), checks assertions, writes a report. Produces
// one screenshot per failure so the fix agent can see what the user saw.
//
// Usage:
//   node tests/qa-loop/run.mjs                # run all journeys
//   node tests/qa-loop/run.mjs --only=<id>    # only one journey
//   node tests/qa-loop/run.mjs --stop-on-fail # exit at first failure
//
// Exit code 0 = all pass. Non-zero = failure count (capped at 255).

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..', '..');
const BROWSE = process.env.BROWSE_BIN || `${process.env.HOME}/.claude/skills/gstack/browse/dist/browse`;
const SITE = process.env.QA_SITE || 'https://tripva.app';
const VP = process.env.QA_VIEWPORT || '390x844';

const args = new Set(process.argv.slice(2));
const onlyArg = [...args].find(a => a.startsWith('--only='));
const only = onlyArg ? onlyArg.split('=')[1] : null;
const STOP_ON_FAIL = args.has('--stop-on-fail');

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf8', stdio: ['ignore','pipe','pipe'] }).trim(); }
  catch (e) { return (e.stdout || '').toString().trim() + (e.stderr || '').toString().trim(); }
}

function bjs(expr) {
  // Escape single quotes for shell — wrap expression in IIFE for safety
  const q = expr.replace(/'/g, `'\\''`);
  const out = run(`'${BROWSE}' js '${q}' 2>&1 | tail -1`);
  return out;
}

function bgoto(url) { return run(`'${BROWSE}' goto '${SITE}${url}' >/dev/null 2>&1`); }
function bviewport(vp) { return run(`'${BROWSE}' viewport ${vp} >/dev/null 2>&1`); }
function bscreenshot(path) { return run(`'${BROWSE}' screenshot '${path}' >/dev/null 2>&1`); }
function bconsole() { return run(`'${BROWSE}' console 2>&1`); }
function bclick(sel) {
  const q = sel.replace(/'/g, `'\\''`);
  return run(`'${BROWSE}' click '${q}' >/dev/null 2>&1`);
}
function bfill(sel, val) {
  const qs = sel.replace(/'/g, `'\\''`);
  const qv = val.replace(/'/g, `'\\''`);
  return run(`'${BROWSE}' fill '${qs}' '${qv}' >/dev/null 2>&1`);
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function executeStep(step, context) {
  switch (step.action) {
    case 'goto':
      bgoto(step.url);
      break;
    case 'wait':
      await sleep(step.ms || 500);
      break;
    case 'eval':
      bjs(step.js);
      break;
    case 'click':
      bclick(step.selector);
      break;
    case 'fill':
      bfill(step.selector, step.value);
      break;
    case 'scroll':
      bjs(`document.querySelector('${step.to}')?.scrollIntoView({block:'start'})`);
      break;
    default:
      throw new Error(`unknown step action: ${step.action}`);
  }
}

function checkAssertion(assertion) {
  for (const key of Object.keys(assertion)) {
    const value = assertion[key];
    switch (key) {
      case 'url-matches': {
        const url = bjs('location.href');
        if (!url.includes(value)) return { ok: false, reason: `url does not include '${value}' — was '${url}'` };
        return { ok: true };
      }
      case 'selector-exists': {
        const exists = bjs(`!!document.querySelector('${value}')`);
        if (exists !== 'true') return { ok: false, reason: `selector '${value}' not present` };
        return { ok: true };
      }
      case 'text-contains': {
        const text = bjs(`(document.body.innerText||'').slice(0,8000)`);
        if (!text.includes(value)) return { ok: false, reason: `body text missing '${value}'` };
        return { ok: true };
      }
      case 'text-not-contains': {
        const text = bjs(`(document.body.innerText||'').slice(0,8000)`);
        if (text.includes(value)) return { ok: false, reason: `body text unexpectedly contains '${value}'` };
        return { ok: true };
      }
      case 'no-404-in-body': {
        if (!value) continue;
        const text = bjs(`(document.body.innerText||'').slice(0,4000).toLowerCase()`);
        if (text.includes('404') || text.includes('not found')) {
          return { ok: false, reason: `body contains 404/not-found text` };
        }
        return { ok: true };
      }
      case 'js-true': {
        const out = bjs(value);
        if (out !== 'true') return { ok: false, reason: `JS expr not true — got '${out}'` };
        return { ok: true };
      }
      case 'js-equals': {
        const out = bjs(value);
        if (out !== String(assertion.expect)) {
          return { ok: false, reason: `JS expr returned '${out}', expected '${assertion.expect}'` };
        }
        return { ok: true };
      }
    }
  }
  return { ok: true };
}

function runJourney(j, reportDir) {
  console.log(`\n[journey] ${j.id} — ${j.name}`);
  const failures = [];

  try {
    for (const step of j.steps) {
      executeStep(step);
    }
  } catch (e) {
    failures.push({ kind: 'step-error', detail: e.message });
  }

  for (const a of (j.assert || [])) {
    const { ok, reason } = checkAssertion(a);
    if (!ok) {
      failures.push({ kind: 'assertion', assertion: a, detail: reason });
      if (STOP_ON_FAIL) break;
    }
  }

  if (failures.length) {
    const screenshotPath = `${reportDir}/${j.id}.png`;
    bscreenshot(screenshotPath);
    const consoleOut = bconsole();
    const logPath = `${reportDir}/${j.id}.console.txt`;
    writeFileSync(logPath, consoleOut);
    console.log(`  ✗ FAIL (${failures.length}) — screenshot: ${screenshotPath}`);
    failures.forEach(f => console.log(`    - ${f.detail}`));
    return { id: j.id, name: j.name, critical: !!j.critical, ok: false, failures, screenshot: screenshotPath, consoleLog: logPath };
  }
  console.log(`  ✓ PASS`);
  return { id: j.id, name: j.name, critical: !!j.critical, ok: true };
}

async function main() {
  if (!existsSync(BROWSE)) {
    console.error(`browse binary not found at ${BROWSE}`);
    process.exit(1);
  }
  bviewport(VP);

  const journeys = JSON.parse(readFileSync(`${__dirname}/journeys.json`, 'utf8')).journeys;
  const toRun = only ? journeys.filter(j => j.id === only) : journeys;
  if (!toRun.length) {
    console.error(`no journeys match ${only}`);
    process.exit(1);
  }

  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '').slice(0, 15);
  const reportDir = `${__dirname}/reports/${stamp}`;
  mkdirSync(reportDir, { recursive: true });

  console.log(`QA loop — ${toRun.length} journey(s) against ${SITE} @ ${VP}`);
  const results = [];
  for (const j of toRun) {
    const r = runJourney(j, reportDir);
    results.push(r);
    if (STOP_ON_FAIL && !r.ok) break;
  }

  const fails = results.filter(r => !r.ok);
  const critFails = fails.filter(r => r.critical);
  const passes = results.filter(r => r.ok);

  const md = [
    `# Tripva QA loop — ${stamp}`,
    ``,
    `- Site: ${SITE}`,
    `- Viewport: ${VP}`,
    `- Passed: ${passes.length} / ${results.length}`,
    `- Failed: ${fails.length} (${critFails.length} critical)`,
    ``,
    `## Results`,
    ``,
    ...results.map(r => {
      const icon = r.ok ? '✅' : (r.critical ? '🔴' : '🟡');
      const base = `${icon} **${r.id}** — ${r.name}`;
      if (r.ok) return base;
      const lines = [base];
      for (const f of r.failures) lines.push(`   - ${f.detail}`);
      if (r.screenshot) lines.push(`   - Screenshot: \`${r.screenshot.replace(ROOT + '/', '')}\``);
      if (r.consoleLog) lines.push(`   - Console: \`${r.consoleLog.replace(ROOT + '/', '')}\``);
      return lines.join('\n');
    }),
    ``,
    `## Reproduce`,
    ``,
    '```bash',
    `node tests/qa-loop/run.mjs --only=<id>`,
    '```',
    ``,
  ].join('\n');

  writeFileSync(`${reportDir}/report.md`, md);
  console.log(`\nReport: ${reportDir}/report.md`);
  console.log(`Passed: ${passes.length} · Failed: ${fails.length} (${critFails.length} critical)`);

  // Exit code: number of critical failures (capped 255), 0 if all pass
  process.exit(Math.min(critFails.length, 255));
}

main().catch(e => { console.error(e); process.exit(255); });
