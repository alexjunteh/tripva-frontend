/**
 * Tripva QA Audit Report
 * Reads qa-results.json and outputs a human-readable pass/fail summary.
 * Usage: node audit-report.js
 *        node run-qa.js && node audit-report.js
 */

const fs = require('fs');
const path = require('path');

const RESULTS_FILE = path.join(__dirname, 'qa-results.json');

function loadResults() {
  if (!fs.existsSync(RESULTS_FILE)) {
    console.error('ERROR: qa-results.json not found. Run `node run-qa.js` first.');
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(RESULTS_FILE, 'utf8'));
}

function statusIcon(status) {
  if (status === 'PASS') return '[PASS]';
  if (status === 'WARN') return '[WARN]';
  return '[FAIL]';
}

function printSeparator(char = '-', width = 70) {
  console.log(char.repeat(width));
}

function main() {
  const results = loadResults();

  const total   = results.length;
  const passed  = results.filter(r => r.status === 'PASS').length;
  const warned  = results.filter(r => r.status === 'WARN').length;
  const failed  = results.filter(r => r.status === 'FAIL').length;

  const allConsoleErrors    = [];
  const allMissingElements  = [];
  const allBrokenResources  = [];
  const allFormFails        = [];

  printSeparator('=');
  console.log('  TRIPVA QA AUDIT REPORT');
  console.log(`  Generated: ${new Date().toISOString()}`);
  printSeparator('=');
  console.log();
  console.log(`  Pages tested : ${total}`);
  console.log(`  PASS         : ${passed}`);
  console.log(`  WARN         : ${warned}  (console errors only)`);
  console.log(`  FAIL         : ${failed}`);
  console.log();
  printSeparator();

  for (const r of results) {
    const icon = statusIcon(r.status);
    console.log(`\n${icon}  ${r.name}`);
    console.log(`      URL       : ${r.url}`);
    console.log(`      HTTP      : ${r.httpStatus ?? 'N/A'}`);
    console.log(`      Load time : ${r.loadTime}ms`);

    // Element checks
    const checkEntries = Object.entries(r.checks);
    if (checkEntries.length > 0) {
      console.log('      Checks:');
      for (const [label, ok] of checkEntries) {
        console.log(`        ${ok ? '[ok]' : '[!!]'} ${label}`);
      }
    }

    // Form checks
    const formEntries = Object.entries(r.formChecks);
    if (formEntries.length > 0) {
      console.log('      Form checks:');
      for (const [label, ok] of formEntries) {
        console.log(`        ${ok ? '[ok]' : '[!!]'} ${label}`);
        if (!ok) allFormFails.push({ page: r.name, label });
      }
    }

    if (r.consoleErrors.length > 0) {
      console.log(`      Console errors (${r.consoleErrors.length}):`);
      r.consoleErrors.forEach(e => {
        console.log(`        ERROR: ${e.slice(0, 140)}`);
        allConsoleErrors.push({ page: r.name, error: e });
      });
    }

    if (r.missingElements.length > 0) {
      console.log(`      Missing elements (${r.missingElements.length}):`);
      r.missingElements.forEach(el => {
        console.log(`        MISSING: ${el}`);
        allMissingElements.push({ page: r.name, element: el });
      });
    }

    if (r.brokenResources.length > 0) {
      console.log(`      Broken resources (${r.brokenResources.length}):`);
      r.brokenResources.forEach(res => {
        console.log(`        ${res.status} ${res.url.slice(0, 100)}`);
        allBrokenResources.push({ page: r.name, ...res });
      });
    }
  }

  console.log();
  printSeparator();
  console.log('\n  SUMMARY');
  printSeparator();

  if (allConsoleErrors.length > 0) {
    console.log(`\n  JS Console Errors (${allConsoleErrors.length} total):`);
    allConsoleErrors.forEach(({ page, error }) => {
      console.log(`    [${page}] ${error.slice(0, 120)}`);
    });
  } else {
    console.log('\n  JS Console Errors: none');
  }

  if (allMissingElements.length > 0) {
    console.log(`\n  Missing UI Elements (${allMissingElements.length} total):`);
    allMissingElements.forEach(({ page, element }) => {
      console.log(`    [${page}] ${element}`);
    });
  } else {
    console.log('\n  Missing UI Elements: none');
  }

  if (allBrokenResources.length > 0) {
    console.log(`\n  Broken Resources (${allBrokenResources.length} total):`);
    allBrokenResources.forEach(({ page, status, url }) => {
      console.log(`    [${page}] ${status} ${url.slice(0, 100)}`);
    });
  } else {
    console.log('\n  Broken Resources: none');
  }

  if (allFormFails.length > 0) {
    console.log(`\n  Form Interaction Failures (${allFormFails.length} total):`);
    allFormFails.forEach(({ page, label }) => {
      console.log(`    [${page}] ${label}`);
    });
  }

  console.log();
  printSeparator('=');

  const deployOk = failed === 0;
  const recommendation = deployOk ? 'DEPLOY OK' : 'BLOCK DEPLOY';
  console.log(`  RECOMMENDATION: ${recommendation}`);
  if (!deployOk) {
    console.log(`  Reason: ${failed} page(s) failed QA checks.`);
    console.log('  Fix all [FAIL] items above before pushing.');
  } else if (warned > 0) {
    console.log('  Note: Console errors present — review before deploy.');
  }
  printSeparator('=');
  console.log();

  // Exit code: 1 if any failures
  process.exit(failed > 0 ? 1 : 0);
}

main();
