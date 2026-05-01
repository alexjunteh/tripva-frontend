# Tripva Nightly QA System

Playwright-based automated QA suite for tripva.app. Runs headless Chromium and
checks all critical pages for load health, UI integrity, and console errors.

---

## Setup

```bash
cd /home/alex/.openclaw/workspace-travelapp/qa
npm install playwright
npx playwright install chromium
```

---

## Running

```bash
# Run QA only (outputs JSON per page to stdout + writes qa-results.json)
node run-qa.js

# Parse results and print human-readable report
node audit-report.js

# Full pipeline (run + report)
npm run full
# or
node run-qa.js && node audit-report.js
```

---

## Pages Tested

| Page            | URL                                                                          |
|-----------------|------------------------------------------------------------------------------|
| Landing Page    | https://tripva.app/                                                          |
| Plan Page       | https://tripva.app/plan                                                      |
| Trip Dashboard  | https://tripva.app/trip?id=950502456a1b0d6bf86a079dc7dada05                 |
| My Trips        | https://tripva.app/mytrips                                                   |

---

## What Is Checked Per Page

1. **HTTP 200** — page loads without a server error
2. **Console errors** — `console.error` events only (warnings ignored)
3. **Key UI elements** — nav, headings, inputs, buttons, content sections
4. **Broken resources** — any image/script/stylesheet returning HTTP 400+
5. **Form interactivity** — text inputs accept typing (Plan page only)

---

## Output Format

Each page produces a JSON block:

```json
{
  "url": "https://tripva.app/",
  "name": "Landing Page",
  "status": "PASS",
  "loadTime": 1243,
  "httpStatus": 200,
  "consoleErrors": [],
  "missingElements": [],
  "brokenResources": [],
  "checks": {
    "http_200": true,
    "nav/header": true,
    "hero h1": true,
    "plan CTA": true,
    "footer or section": true
  },
  "formChecks": {}
}
```

Status values:
- `PASS` — all checks green, no console errors
- `WARN` — all structural checks pass but JS console errors present
- `FAIL` — one or more structural checks failed

---

## Audit Report Recommendation

`audit-report.js` prints a final line:

- `RECOMMENDATION: DEPLOY OK` — all pages passed
- `RECOMMENDATION: BLOCK DEPLOY` — one or more pages failed

Exit code `0` = deploy safe. Exit code `1` = block deploy.

---

## Nightly Automation (cron example)

```cron
0 2 * * * cd /home/alex/.openclaw/workspace-travelapp/qa && node run-qa.js && node audit-report.js >> /tmp/tripva-nightly.log 2>&1
```

---

## Files

| File              | Purpose                                        |
|-------------------|------------------------------------------------|
| `run-qa.js`       | Playwright runner — outputs JSON, writes file  |
| `audit-report.js` | Parses qa-results.json, prints summary         |
| `qa-results.json` | Generated output — last run results            |
| `package.json`    | Dependencies (playwright)                      |
| `NIGHTLY_AUDIT.md`| This documentation                             |
