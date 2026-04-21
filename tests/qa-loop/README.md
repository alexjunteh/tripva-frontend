# Tripva QA Loop

Autonomous human-like QA against the live site. Two layers:

1. **Scripted journeys** (`journeys.json` → `run.mjs`) — regression-style
   flows that exercise top user paths: plan a trip, open budget, load
   packing, click "See full demo", etc. Each journey has explicit
   assertions. Fast, deterministic.

2. **Exhaustive crawler** (`explore.mjs`) — enumerates every visible
   button / link / `[role=button]` / `[onclick]` element on each page,
   then clicks each in isolation and checks:
   - Click didn't throw a JS error
   - No new console error appeared
   - No visible "API error" / "Could not load" text surfaced
   - Any opened modal has a dismiss path
   Catches bugs in UI elements that aren't yet covered by a scripted
   journey — any button becomes a test.

## Run

```bash
# Both layers — fast check
./tests/qa-loop/loop.sh

# Just the scripted journeys
./tests/qa-loop/loop.sh --journeys-only

# Just the exhaustive crawl
./tests/qa-loop/loop.sh --explore-only

# Against a staging environment
./tests/qa-loop/loop.sh --site=https://staging.tripva.app

# One specific journey
node tests/qa-loop/run.mjs --only=budget-tab-usable

# One specific page
node tests/qa-loop/explore.mjs --page=trip
```

Exit codes:
- `0` — all pass, ship-ready
- `N>0` — N critical failures; read latest report in `reports/`

## The loop

```
┌──────────────────────────┐
│  ./tests/qa-loop/loop.sh │
└────────────┬─────────────┘
             │
             ▼
  ┌───────────────────────┐
  │  All green? ✓         │────yes───▶  Ship it
  └───────────┬───────────┘
              │ no
              ▼
  ┌───────────────────────┐
  │  Read latest report   │
  │  reports/<stamp>/*.md │
  └───────────┬───────────┘
              │
              ▼
  ┌───────────────────────┐
  │  Apply fix in source  │
  │  commit + push main   │──────────▶  CF Pages deploys
  └───────────┬───────────┘                       │
              │                                   │
              └──────────[re-run loop]────────────┘
```

A supervising Claude Code session can execute this loop autonomously:

```
1. Run /qa-loop
2. If failures, grep report.md for each failure's reason + screenshot
3. Locate source code causing each bug (grep selector / text)
4. Fix + commit + push --no-verify
5. Wait for CF deploy (poll HTML for commit marker)
6. Re-run /qa-loop
7. Repeat until 0 failures
```

## Adding a journey

Edit `journeys.json`:

```json
{
  "id": "unique-slug",
  "name": "Human-readable description",
  "critical": true,
  "steps": [
    { "action": "goto", "url": "/some-path?qa=1" },
    { "action": "wait", "ms": 5000 },
    { "action": "click", "selector": "#myButton" },
    { "action": "fill",  "selector": "#email", "value": "test@x.com" },
    { "action": "eval",  "js": "someFunction()" }
  ],
  "assert": [
    { "selector-exists": ".success-banner" },
    { "text-contains": "Saved" },
    { "js-true": "window.plan?.days?.length > 0" },
    { "js-equals": "document.title", "expect": "Tripva — My Trip" }
  ]
}
```

Supported step actions: `goto`, `wait`, `click`, `fill`, `eval`, `scroll`.
Supported assertions: `selector-exists`, `text-contains`, `text-not-contains`,
`url-matches`, `js-true`, `js-equals` (with `expect`), `no-404-in-body`.

## Architecture notes

- Runs against **production** by default. Set `QA_SITE` env to override.
- Uses gstack's `browse` binary (Playwright under the hood). No additional
  dependency — just Node.
- Reports go to `tests/qa-loop/reports/<UTC-stamp>/`. Each failure gets a
  screenshot + console log.
- Explore mode automatically stable-references each element with a
  `data-qa-ref` attribute so flaky selectors don't cause false failures.
- Modals are auto-dismissed between element tests via `dismissOverlays()`.
- External links are noted but not clicked (no open redirects, no real
  network to other sites).
- Destructive actions (Delete, Sign out, Cancel subscription) are skipped
  by text pattern to preserve state.
