# Tripva Frontend

Static HTML/CSS/JS frontend for [Tripva](https://tripva.app) — AI-powered trip planning in 30 seconds.  
Deployed via Cloudflare Pages. No build step.

---

## E2E Tests (Playwright)

### Prerequisites

- Node.js 18+
- `npm install` (installs `@playwright/test`)
- Playwright browsers: `npx playwright install --with-deps`

### Running tests

```bash
# Run all tests against production (https://tripva.app)
npm run test:e2e

# Run against a local dev server
BASE_URL=http://localhost:8080 npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Headed (watch the browser)
npm run test:e2e:headed

# View last HTML report
npm run test:e2e:report
```

### Environment variables

| Variable   | Default               | Purpose                        |
|------------|-----------------------|--------------------------------|
| `BASE_URL` | `https://tripva.app`  | App origin under test          |

The backend (`https://tripai-backend.vercel.app`) is network-mocked inside tests that hit AI endpoints, so no API key is needed and no credits are consumed.

### Test coverage (`tests/e2e/flows.spec.js`)

| # | Test | What it verifies |
|---|------|-----------------|
| 1 | **Homepage loads** | `.hero h1` has text; `.nav-cta` visible |
| 2 | **Trip generation** | Fill `plan.html` form (Paris, 3 days, couple), submit, SSE stream mocked to complete, assert navigation to `trip.html` and bottom-nav renders |
| 3 | **Shared trip URL** | Load `/trip.html?id=<id>` as an unauthenticated cold visitor (localStorage seeded with a different trip); assert `#viewerBanner` appears |
| 4 | **Auth gate** | `/mytrips.html` shows `#authSection` + email input with no session in storage |
| 5 | **Mobile 375×812** | Homepage `.hero h1` visible; trip dashboard (`?demo=1`) bottom-nav renders at mobile width |

### How the SSE mock works

The trip-generation test intercepts `POST /api/plan` with `page.route()` and returns a complete `text/event-stream` body in one shot:

```
data: {"type":"start","message":"Planning your Paris trip…"}

data: {"type":"done","data":{"plan":{…}}}

```

`plan.html` has a buffered-SSE fallback that processes all events after the stream closes, so this is equivalent to a real streaming response. The mock plan includes a non-empty `budget` array so `openGeneratedTrip()` skips the `/api/patch` budget-heal call and navigates immediately to `/trip.html`.

### Configuration (`playwright.config.js`)

- **Browsers**: Chromium + Firefox (desktop)
- **Parallelism**: fully parallel locally; single worker on CI
- **Retries**: 0 locally, 2 on CI
- **Artifacts**: HTML report → `playwright-report/`; screenshots on failure; traces on first retry

### CI usage

```yaml
- name: Install deps
  run: npm ci
- name: Install browsers
  run: npx playwright install --with-deps chromium firefox
- name: Run E2E
  run: npm run test:e2e
  env:
    CI: true
    BASE_URL: https://tripva.app
```
