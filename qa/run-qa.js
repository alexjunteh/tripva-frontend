/**
 * Tripva QA Runner — Playwright headless Chromium
 * Usage: node run-qa.js
 * Output: JSON to stdout + qa-results.json
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PAGES = [
  {
    url: 'https://tripva.app/',
    name: 'Landing Page',
    elements: {
      'nav/header':           'nav, header',
      'hero h1':              'h1',
      'plan CTA':             'a[href="/plan"], button:has-text("Plan"), a:has-text("Plan"), a:has-text("Start")',
      'footer or section':    'footer, section',
    },
    formChecks: [],
  },
  {
    url: 'https://tripva.app/plan',
    name: 'Plan Page',
    elements: {
      'destination input':    'input#f-dest, input[placeholder*="Japan" i], input[name*="dest" i], input[placeholder*="Italy" i]',
      'any text input':       'input[type="text"], input:not([type]), textarea',
      'generate button':      'button[type="submit"], button:has-text("Generate"), button:has-text("Plan"), button:has-text("Create")',
    },
    formChecks: [
      { selector: 'input[type="text"], input:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"])', label: 'text input accepts typing' },
    ],
  },
  {
    url: 'https://tripva.app/trip?id=950502456a1b0d6bf86a079dc7dada05',
    name: 'Trip Dashboard',
    elements: {
      'page heading':         'h1, h2, .v2-hero-title, #liveHeroLocation, .planner-header',
      'main content area':    'main, [class*="trip"], [class*="dashboard"], [class*="content"]',
      'tab or section nav':   '[role="tab"], [class*="tab"], [class*="nav"], nav',
      'trip data section':    '[class*="day"], [class*="itinerary"], [class*="schedule"], [class*="activity"], section',
    },
    formChecks: [],
  },
  {
    url: 'https://tripva.app/mytrips',
    name: 'My Trips',
    elements: {
      'page heading':         'h1, h2, .planner-header',
      'main content':         'main',
      'trip cards or list':   '[class*="trip"], [class*="card"], [class*="item"], li, article',
      'empty state or items': '[class*="empty"], [class*="no-trip"], p, [class*="card"]',
    },
    formChecks: [],
  },
];

const PAGE_TIMEOUT = 30000;

async function testPage(browser, pageDef) {
  const { url, name, elements, formChecks } = pageDef;
  const result = {
    url,
    name,
    status: 'PASS',
    loadTime: 0,
    httpStatus: null,
    consoleErrors: [],
    missingElements: [],
    brokenResources: [],
    checks: {},
    formChecks: {},
  };

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; TripvaQA/1.0; +https://tripva.app)',
  });
  const page = await context.newPage();

  // Collect console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      result.consoleErrors.push(msg.text());
    }
  });

  // Collect broken resources
  page.on('response', (response) => {
    const status = response.status();
    if (status >= 400) {
      const resUrl = response.url();
      // Skip known analytics / tracking endpoints that may 4xx intentionally
      const ignore = ['/favicon.ico', 'analytics', 'tracking', 'telemetry', 'beacon'];
      const shouldIgnore = ignore.some((kw) => resUrl.includes(kw));
      if (!shouldIgnore) {
        result.brokenResources.push({ url: resUrl, status });
      }
    }
  });

  try {
    const t0 = Date.now();
    const response = await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: PAGE_TIMEOUT,
    });
    result.loadTime = Date.now() - t0;
    result.httpStatus = response ? response.status() : null;

    // Check HTTP status
    if (!response || response.status() >= 400) {
      result.status = 'FAIL';
      result.checks['http_200'] = false;
    } else {
      result.checks['http_200'] = true;
    }

    // Check elements
    for (const [label, selector] of Object.entries(elements)) {
      try {
        const count = await page.locator(selector).count();
        result.checks[label] = count > 0;
        if (count === 0) {
          result.missingElements.push(label);
          result.status = 'FAIL';
        }
      } catch (e) {
        result.checks[label] = false;
        result.missingElements.push(`${label} (selector error: ${e.message})`);
        result.status = 'FAIL';
      }
    }

    // Form interaction checks
    for (const fc of formChecks) {
      try {
        const el = page.locator(fc.selector).first();
        const cnt = await page.locator(fc.selector).count();
        if (cnt > 0) {
          await el.click({ timeout: 5000 });
          await el.type('test', { delay: 30 });
          const val = await el.inputValue();
          result.formChecks[fc.label] = val.includes('test');
          if (!result.formChecks[fc.label]) result.status = 'FAIL';
        } else {
          result.formChecks[fc.label] = false;
          result.status = 'FAIL';
        }
      } catch (e) {
        result.formChecks[fc.label] = false;
        result.status = 'FAIL';
      }
    }

    // Console errors are non-fatal for PASS/FAIL but we still flag them
    if (result.consoleErrors.length > 0 && result.status === 'PASS') {
      result.status = 'WARN';
    }

  } catch (err) {
    result.status = 'FAIL';
    result.checks['page_load'] = false;
    result.consoleErrors.push(`LOAD ERROR: ${err.message}`);
  } finally {
    await context.close();
  }

  return result;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const pageDef of PAGES) {
    process.stderr.write(`Testing: ${pageDef.name} (${pageDef.url})\n`);
    const result = await testPage(browser, pageDef);
    results.push(result);
    // Print individual result immediately
    console.log(JSON.stringify(result, null, 2));
  }

  await browser.close();

  // Write combined results file for audit-report.js
  const outPath = path.join(__dirname, 'qa-results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  process.stderr.write(`\nResults saved to ${outPath}\n`);
}

main().catch((err) => {
  console.error('Fatal QA error:', err.message);
  process.exit(1);
});
