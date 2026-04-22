#!/usr/bin/env node
// tests/qa-loop/redteam.mjs — mutation / chaos testing for the audit.
//
// Seeds the app with intentionally-broken data, then runs the same assertions
// the audit uses. EXPECTED outcome: every seeded defect is caught.
// If any defect slips past, the audit has a hole.
//
// This is how we know the audit is SENSITIVE, not just PERMISSIVE.
//
// Usage:  node tests/qa-loop/redteam.mjs

import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BROWSE = process.env.BROWSE_BIN || `${process.env.HOME}/.claude/skills/gstack/browse/dist/browse`;
const SITE = process.env.QA_SITE || 'https://tripva.app';

function run(cmd) { try { return execSync(cmd, {encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim(); } catch(e){ return (e.stdout||'').toString().trim(); } }
function bjs(expr){ const q = expr.replace(/'/g, `'\\''`); return run(`'${BROWSE}' js '${q}' 2>&1 | tail -1`); }
function bgoto(url){ run(`'${BROWSE}' goto '${SITE}${url}' >/dev/null 2>&1`); }
const sleep = ms => run(`sleep ${ms / 1000}`);

// Canonical "good" plan we'll MUTATE in various ways
function goodPlan() {
  return {
    trip: { id:'rt-good', name:'Red-team Paris', destination:'Paris', startDate:'2026-06-01', endDate:'2026-06-04', currency:'EUR', budget:'$3000' },
    days: [
      { day:1, date:'2026-06-01', title:'Arrival', timeline:[
        {time:'09:00', title:'Eiffel Tower', detail:'Visit', type:'activity', mapQuery:'Eiffel Tower, Paris'},
        {time:'13:00', title:'Lunch', detail:'Café', type:'meal'},
      ]},
      { day:2, date:'2026-06-02', title:'Louvre', timeline:[{time:'10:00', title:'Louvre', detail:'Museum entry', type:'activity', mapQuery:'Louvre, Paris'}]}
    ],
    hotels:[{city:'Paris',name:'Hotel Test',price:'€180/night',stars:4}],
    budget:[
      {item:'Flights', amount:'€400', status:'booked', category:'transport'},
      {item:'Hotel', amount:'€540', status:'pending', category:'accommodation'},
      {item:'Meals', amount:'€300', status:'pending', category:'food'}
    ],
    tickets:[],
    urgent:[]
  };
}

// Each mutation: apply it, reload page, run the assertion, expect FAIL.
// If the assertion passes on the mutated state, the audit has a blind spot.
const mutations = [
  {
    id: 'all-zero-budget',
    description: 'Budget items all amount:0 — hero should NOT show sensible total',
    mutate: (p) => { p.budget.forEach(b => b.amount = '$0'); return p; },
    expectAuditToFail: true,
    check: () => bjs(`
      (() => {
        const hero = document.querySelector('.budget-hero-num')?.textContent||'';
        const num = parseFloat((hero.match(/[\\d,]+(?:\\.\\d+)?/)||[0])[0].toString().replace(/,/g,''));
        return document.querySelectorAll('.budget-row').length > 0 && num === 0 ? 'caught' : 'missed';
      })()
    `)
  },
  {
    id: 'empty-day-timelines',
    description: 'All days have timeline:[] — Days tab should surface this as failure',
    mutate: (p) => { p.days.forEach(d => d.timeline = []); return p; },
    expectAuditToFail: true,
    check: () => bjs(`
      (() => {
        const cards = [...document.querySelectorAll('.day-big-card')];
        if (!cards.length) return 'missed-no-cards';
        const withEvents = cards.filter(c => parseInt((c.innerText.match(/(\\d+)\\s*events?/i)||[0,0])[1]) > 0 || c.querySelectorAll('.day-big-events').length > 0);
        return withEvents.length === 0 ? 'caught' : 'missed';
      })()
    `)
  },
  {
    id: 'name-missing-from-dom',
    description: 'Trip.name set but never rendered — DOM should not contain it',
    mutate: (p) => { p.trip.name = 'RedTeamSentinelString12345'; return p; },
    expectAuditToFail: false, // name should be found in DOM if rendering works
    check: () => bjs(`
      (() => {
        const want = 'RedTeamSentinelString12345';
        return (document.body.innerText||'').includes(want) || (document.title||'').includes(want) ? 'rendered' : 'missing';
      })()
    `)
  },
  {
    id: 'currency-mismatch',
    description: 'trip.currency EUR but amounts have no symbol — data-src should still resolve to EUR',
    mutate: (p) => { p.budget.forEach(b => b.amount = b.amount.replace(/[€$£¥]/g, '')); return p; },
    expectAuditToFail: false, // data-src from trip.currency overrides
    check: () => bjs(`
      [...document.querySelectorAll('.budget-amount[data-src]')].every(el => el.dataset.src === 'EUR') ? 'src-eur' : 'src-fallback'
    `)
  }
];

async function main() {
  console.log(`━━━ Red-team mutation tests ━━━`);
  const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\\.\\d{3}/,'').slice(0,15);
  const reportDir = `${__dirname}/reports/${stamp}-redteam`;
  mkdirSync(reportDir, { recursive: true });

  let passed = 0, failed = 0;
  for (const m of mutations) {
    console.log(`\n[mutation] ${m.id} — ${m.description}`);
    // Seed plan into localStorage + reload
    const mutated = m.mutate(goodPlan());
    const planJson = JSON.stringify(mutated).replace(/'/g, `'\\''`);
    bgoto('/');
    sleep(1000);
    bjs(`localStorage.setItem('tripva_plan', '${planJson}'); true`);
    bgoto('/trip');  // no id → localStorage fallback
    sleep(8000);

    const result = m.check();
    const expected = m.expectAuditToFail ? 'caught' : ['rendered','src-eur'].includes(result) ? result : 'check-expected-ok-but-got-' + result;
    const asExpected = m.expectAuditToFail ? result === 'caught' : ['rendered','src-eur'].includes(result);

    if (asExpected) {
      console.log(`  ✓ PASS — mutation ${m.expectAuditToFail ? 'caught by audit' : 'handled correctly'} (${result})`);
      passed++;
    } else {
      console.log(`  ✗ FAIL — ${m.expectAuditToFail ? 'audit missed mutation' : 'correct-behavior path broken'} (got: ${result})`);
      failed++;
    }
  }

  const md = [
    `# Red-team mutation report — ${stamp}`, ``,
    `Passed: ${passed} · Failed: ${failed}`, ``,
    `Each mutation tests a specific bug class. 'Passed' means the audit caught`,
    `the defect OR the correct-behavior path survived the stress test.`,
  ].join('\\n');
  writeFileSync(`${reportDir}/report.md`, md);

  console.log(`\nReport: ${reportDir}/report.md`);
  console.log(`Passed: ${passed} · Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(255); });
