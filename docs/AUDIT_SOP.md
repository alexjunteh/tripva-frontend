# Visual Audit SOP

**Purpose:** After any significant change to `index.html`, `plan.html`, `trip.html`, or `mytrips.html`, run this audit before claiming the work is done. Designed to catch what was missed in the photospot/FAB-toggle/day-card-margin bugs — i.e. the stuff that hides inside drill-in surfaces and only shows when a real user reaches it.

**Call it:** `./tests/visual/audit.sh [--quick|--full|--archetypes]`

**When:**
- **After any commit that touches HTML/CSS/JS in production files** — at minimum `--quick`.
- **Before pushing a sequence of commits to main** — `--full`.
- **After any change to the plan form, archetype flow, or backend contract** — `--archetypes`.
- **On CI, post-deploy, as a canary** — `--quick` with live URL target.

**Exit contract:**
- Exit `0` — all gates passed, safe to claim done.
- Exit `1` — one or more gates failed. Report HTML enumerates each failure with evidence.
- Exit `2` — infrastructure failure (browse binary missing, live site unreachable, etc.).

---

## Guiding principles

1. **Measure, don't eyeball.** Dimensions from `getBoundingClientRect()` beat any screenshot interpretation.
2. **Drill in.** Tab-level screenshots catch ~80% of bugs. The last 20% hide in modals, sheets, FAB actions, overlays.
3. **Simulate real users.** At least one trip per archetype. Pre-trip / on-trip / post-trip states.
4. **Pin to DESIGN.md.** Every visual rule in DESIGN.md is a checkable contract. Anti-patterns are regex-detectable.
5. **Cold-start every run.** `localStorage.clear()`, `?v=<timestamp>` cache-bust. Never trust session state.
6. **Every failure gets evidence.** Screenshot + DOM state + reproduction command.

---

## Phase structure

The SOP is six phases. Each phase has a pass gate. Fail any gate → audit fails.

```
Phase 0  Pre-flight           (infrastructure + git state)
Phase 1  Tab-level capture    (10 screens: 5 tabs × 2 viewports)
Phase 2  Drill-in capture     (every modal + sheet + overlay)
Phase 3  Interactive states   (form validation, toggles, repeaters)
Phase 4  Multi-archetype sim  (generate 1 trip per of 6 archetypes)
Phase 5  Design-review pass   (tokens, typography, anti-patterns)
Phase 6  Report + gates       (HTML contact sheet, exit code)
```

---

## Phase 0 — Pre-flight

### Infrastructure checks

```bash
# browse binary exists + is executable
[ -x "$HOME/.claude/skills/gstack/browse/dist/browse" ] || exit 2

# bun is in PATH (browse depends on it)
export PATH="$HOME/.bun/bin:$PATH"; command -v bun || exit 2

# ImageMagick compare exists (for pixel diff)
command -v compare || exit 2

# Live site reachable
curl -sfI https://tripva.app/ > /dev/null || { echo "tripva.app unreachable"; exit 2; }

# Backend reachable
curl -sf https://tripai-backend.vercel.app/api/health > /dev/null || echo "WARN: backend unhealthy"
```

### Git state capture

Record `HEAD`, `branch`, `uncommitted diff --stat`. Fail-soft if uncommitted changes exist (audit can still run, but the report notes work-in-progress).

### Pass gate

- browse binary executable ✓
- bun in PATH ✓
- ImageMagick available ✓
- tripva.app returns 200 ✓

---

## Phase 1 — Tab-level capture (mobile + desktop)

Cold-start load → capture → DOM-measure → compare against baseline.

### Target surfaces (every audit, both viewports)

| Surface | URL | Wait | Assertion |
|---|---|---|---|
| Landing | `/` | 3s | 5 sections visible (hero · archetype grid · Watch · proof & price · final CTA) |
| Plan form (default) | `/plan` | 2s | Archetype selector visible, "couple" selected by default |
| Plan form (family) | `/plan?archetype=family` | 2s | Family pill selected, child-age repeater visible, 4 travelers default |
| My Trips (signed out) | `/mytrips` | 2s | Auth card centered, not clipped by dead space |
| Trip — Live | `/trip?id=<fixture>` + switchTab('plan') | 6s | FocusCard visible, no placeholder text ("—"), countdown renders |
| Trip — Overview | switchTab('trip') | 3s | Days/People/Budget stats populated (not "-") |
| Trip — Days | switchTab('days') | 3s | Day cards full-width, distinct images per day, dates correct |
| Trip — Tickets | switchTab('tickets') | 3s | Either content or explicit empty state — no blank area |
| Trip — Budget | switchTab('budget') | 3s | Budget rendered (confirmed + pending) OR explicit empty state |

### DOM measurements per surface

For each viewport, JS-eval and assert:

```js
// Day-card sanity (was broken by margin-right:140px)
const cards = document.querySelectorAll('.day-big-card');
for (const c of cards) {
  const r = c.getBoundingClientRect();
  assert(r.width >= 300, `day card too narrow: ${r.width}px`);  // was 222 when broken
  assert(r.width / r.height >= 1.4 && r.width / r.height <= 2.0, `day card aspect off: ${(r.width/r.height).toFixed(2)}`);
}

// Tap-target sanity
document.querySelectorAll('button, a, [role="button"]').forEach(el => {
  const r = el.getBoundingClientRect();
  if (r.width > 0 && r.height > 0) {
    assert(r.height >= 44 || el.offsetParent === null, `tap target too small: ${el.outerHTML.slice(0, 80)} ${r.width}x${r.height}`);
  }
});

// Placeholder text didn't survive
const placeholders = [...document.body.innerText.matchAll(/\b(TBD|FIXME|lorem|Lorem|undefined|null)\b/g)];
assert(placeholders.length === 0, `placeholder text leaked: ${placeholders[0]}`);

// No console errors at all
assert((await readConsoleErrors()).length === 0, 'console errors during load');
```

### Pass gate

- All 10 screens captured without error
- No console errors on any screen
- All DOM assertions pass
- Pixel diff vs. baseline ≤ 2% (with 2% fuzz) — OR the diff is annotated as expected (intentional redesign)

---

## Phase 2 — Drill-in capture

**This is the phase I missed before.** Every interactive surface must be opened and screenshotted.

### Required drill-ins

For the fixture trip loaded in Phase 1:

| Surface | How to open | Assertion |
|---|---|---|
| Day sheet (each day) | `openDaySheet(i)` for i in 0..days.length-1 | All timeline items fit within viewport width; no horizontal scroll; photospot images have bounded aspect-ratio (`≤2.0`, `≥1.4`) |
| Edit trip modal | `openEditModal()` | Form fields pre-populated with current trip data (not stale `tripMeta`); Save button enabled |
| Packing list modal | `openPackModal()` | Categories visible OR explicit error state with "Try again" affordance |
| FAB expanded | `toggleFab()` | Exactly the DESIGN.md-approved actions (no stray "Light mode" etc.); all buttons ≥44px tap target |
| More overlay | `document.getElementById('moreOverlay')?.classList.add('open')` | Tips / SOS sub-sections render without overflow |
| Book card detail | Click first `.book-card` | Detail panel opens, "Book" CTA present |
| AI edit panel | `toggleAiChat()` | Input field visible, no clipped chrome |
| Route map | switchTab('trip'), scroll into view | Leaflet initializes, pin count > 0 OR empty state |
| Auth modal | Navigate to /plan; submit form sans auth | Modal slides up, email input focused, "Skip" present |

### Photospot-specific assertion

Inside day sheets that include `type: "photospot"` items:

```js
document.querySelectorAll('.tl-ps-photo').forEach(img => {
  const r = img.getBoundingClientRect();
  assert(r.width === img.parentElement.getBoundingClientRect().width, 'photospot not full-width');
  const ratio = r.width / r.height;
  assert(ratio >= 1.5 && ratio <= 1.9, `photospot aspect off: ${ratio.toFixed(2)}`);  // target 16:9 = 1.78
  assert(img.naturalWidth === 0 || img.complete, 'photospot image not loaded');
});
```

### Pass gate

- Every listed drill-in opens without throwing
- Photospot images (if any) are 16:9 aspect ±5%
- Tap targets in every modal ≥44px
- No off-screen layout breaks

---

## Phase 3 — Interactive states

Simulate user actions and verify behavior.

### Plan form — validation

```
1. Navigate /plan
2. Click submit with no fields → expect toast "Where are you going?"
3. Fill destination, click submit → expect toast "Pick your travel dates"
4. Fill dates, click submit → expect toast "Enter your budget"
5. Fill budget, clear all interest chips, click submit → expect toast "Pick at least one interest"
```

### Archetype switcher

```
1. Navigate /plan?archetype=solo — assert .arch-pill[data-arch=solo] has class 'active'
2. Click Couple pill → assert occasion chips reveal
3. Click Family pill → assert child-age repeater reveals + traveler count changes to 4
4. Click Friends pill → assert shared-accom toggle reveals
5. Interest chip catalog changes per archetype (DOM check)
```

### Child-age repeater

```
1. Archetype=family
2. Click "+ Add child" 5 times → expect 6 total pills
3. Click "+ Add child" again → expect toast "6 kids max"
4. Click remove on pill 3 → expect 5 remaining
5. Try to remove last pill → expect toast "Keep at least one child"
```

### Toggle switches

Each `.toggle-switch`:
1. Click → class `on` toggles, `aria-checked` flips
2. Space key → same
3. Enter key → same

### Currency converter

Budget tab:
1. Click MYR pill → assert all budget amounts suffix/convert
2. Click USD pill → amounts change
3. Active pill has `data-cur` matching session state

### Pass gate

- All validation toasts fire correctly
- Archetype switching reveals correct conditional fields
- Repeater honors min/max
- Toggles work keyboard + pointer
- Currency converter switches visibly

---

## Phase 4 — Multi-archetype simulation

Generate one trip per archetype to expose per-traveler-type rendering differences.

### Matrix

| Archetype | Test destination | Duration | Expected output |
|---|---|---|---|
| solo | Lisbon | 3 days | Hostel/boutique accom options; packed-pace default |
| couple | Paris | 4 days | Restaurant-forward day structure; evening-weighted |
| family | Tokyo | 5 days | Kid-friendly activities; shorter day lengths; dietary notes shown |
| friends | Barcelona | 4 days | Group-sized accommodation; split-expense suggestions |
| adventure | Iceland | 6 days | Weather-sensitive pacing; gear list |
| nomad | Bali (Ubud) | 14 days | Slower pace; coworking mentions; weekly rhythm |

### Per-trip checks

After generation (wait up to 90s per stream):

```
1. Confirm redirect to /trip?id=<gist>
2. Wait 6s for populateDashboard
3. Assert plan.days.length >= expected_days
4. Assert plan.trip.destination contains target city
5. Open FocusCard, confirm title contains target city OR day 1 activity
6. Open Days tab — confirm Wikipedia upgrade resolves ≥50% of days within 10s
7. Capture screenshot → name with archetype + destination
```

### Cached mode

For CI / rapid re-runs, use `tests/visual/fixtures/<archetype>.json` — pre-generated payloads. Skip live generation. Still test rendering. Gate: all 6 fixtures render without error.

### Pass gate

- Each of 6 trips either generates successfully OR fixture loads
- Archetype-specific fields appear in the rendered output where expected
- Wikipedia imagery resolves for each destination

---

## Phase 5 — Design-review pass

Keyed to `DESIGN.md`. Every rule becomes a check.

### Color tokens

```js
const styles = getComputedStyle(document.documentElement);
assert(styles.getPropertyValue('--bg').trim() === '#0A0B10' || '#0a0a12', 'wrong --bg');
assert(styles.getPropertyValue('--purple').trim().toLowerCase() === '#7c6af7', 'wrong --purple');
```

All tokens defined in `DESIGN.md §Color` must be present.

### Typography

```js
// Display headings use Cormorant Garamond
document.querySelectorAll('.page-title, .nowFocus-title, h1.section-h2').forEach(el => {
  const font = getComputedStyle(el).fontFamily;
  assert(/Cormorant/i.test(font) || /Georgia/i.test(font), `display font not Cormorant: ${font}`);
});

// Body uses DM Sans
document.querySelectorAll('body, .trip-name, .itin-title').forEach(el => {
  const font = getComputedStyle(el).fontFamily;
  assert(/DM Sans|apple-system|BlinkMacSystemFont/i.test(font), `body font not DM Sans: ${font}`);
});

// Mobile body min 15px
if (window.innerWidth < 400) {
  const bodySize = parseFloat(getComputedStyle(document.body).fontSize);
  assert(bodySize >= 15, `body font < 15px on mobile: ${bodySize}`);
}
```

### Spacing + radius

Spot-check: all CSS values should round to the documented scale. Automated check is low-value (regex false positives); rely on eye + the checklist for this.

### Anti-pattern detection

The DESIGN.md anti-pattern table becomes regex assertions over rendered HTML:

```js
const html = document.documentElement.outerHTML;
const text = document.body.innerText;

// "47++" double-plus
assert(!/\d+\+\+/g.test(text), 'AI-slop "47++" pattern detected');

// Purple text on dark cards (contrast fail)
// (heuristic: no element with color matching --purple on a surface)
document.querySelectorAll('.card, .ops-card, .surface').forEach(el => {
  const c = getComputedStyle(el).color;
  assert(!/rgb\(124,\s*106,\s*247\)/.test(c), 'purple text on dark surface (WCAG fail)');
});

// Emoji mascot / gamified copy
assert(!/You did it!|Streak|Level up/.test(text), 'gamified copy detected');

// Truncated titles in core surfaces (sign of bad layout)
document.querySelectorAll('.focus-title, .day-big-title, .trip-card-dest').forEach(el => {
  if (el.scrollWidth > el.clientWidth) {
    flag(`title truncated: ${el.textContent.slice(0, 40)}...`);
  }
});

// "Light mode" toggle (brand is dark-only)
assert(!/Light mode|Dark mode/i.test(html), 'theme toggle violates dark-only rule');

// Fake star ratings
assert(!/★★★★★/g.test(text) || /\d+ reviews?/i.test(text), 'star rating without reviews');
```

### Accessibility

```js
// Every interactive element has accessible name
document.querySelectorAll('button, a, input').forEach(el => {
  const name = el.getAttribute('aria-label') || el.textContent.trim() || el.getAttribute('title');
  assert(name || el.offsetParent === null, `missing accessible name: ${el.outerHTML.slice(0, 100)}`);
});

// Focus ring visible on tab-focus
// (manual spot-check — automated detection is unreliable)

// prefers-reduced-motion respected
// (visual inspection; animations should be removed via CSS media query)
```

### Pass gate

- Color tokens present and correct
- Display/body fonts match DESIGN.md
- No anti-pattern regex matches
- Every interactive element has accessible name
- Mobile body text ≥15px

---

## Phase 6 — Report + gates

### Output structure

```
tests/visual/reports/<YYYY-MM-DD-HHMM>/
├── audit.html              # one-page HTML report
├── audit.json              # machine-readable results
├── phase-1-tabs/*.png      # tab-level screenshots
├── phase-2-drillin/*.png   # drill-in screenshots
├── phase-3-states/*.png    # interactive-state screenshots
├── phase-4-archetypes/*.png  # per-archetype trip renders
├── diffs/*.png             # pixel-diff highlighted against baseline
└── failures.log            # every assertion that failed, with context
```

### HTML report sections

1. **Summary** — pass/fail per phase, total duration, commit sha
2. **Failures** — numbered list with screenshot + assertion text + reproduction command
3. **Visual diff grid** — baseline / latest / diff, one row per surface
4. **Drill-in gallery** — every modal + sheet grouped
5. **Archetype matrix** — 6×1 card layout showing per-archetype outputs
6. **Design-review findings** — token/typo/anti-pattern results in tables
7. **DOM measurements** — card dimensions, tap-target sizes, font sizes per surface

### Pass gates (must ALL pass)

| Gate | Threshold |
|---|---|
| Phase 0 infra | 4/4 checks pass |
| Phase 1 tab-level | 0 console errors; all DOM assertions pass; pixel-diff ≤2% or annotated |
| Phase 2 drill-in | 0 modals fail to open; 0 photospot aspect failures |
| Phase 3 interactive | All form validations fire correctly; archetype switcher works |
| Phase 4 archetype | ≥5 of 6 archetypes render successfully (allow 1 flake) |
| Phase 5 design-review | 0 anti-pattern matches; all color/font tokens correct |

One failed gate = audit fails. Exit code 1.

---

## When the SOP fails

1. **Read the HTML report** — it groups failures by phase, each with evidence.
2. **Reproduce locally** — every failure includes a reproduction command (usually a specific `$B goto` + JS eval).
3. **Fix the code**, not the assertion. The assertion IS the contract from DESIGN.md.
4. **Re-run the SOP.** Don't cherry-pick phases on re-run (regressions hide in between).
5. **If the assertion itself is wrong** — fix the SOP in a separate commit. Don't silently weaken gates to get green.

---

## Full coverage inventory (refreshed 2026-04-22)

Audit runs in four layers. Every check is live-gated on every push unless noted.

### Layer 1 — Visual + structural (`tests/visual/audit.sh`)

**Phase 1 — landing & core pages** (new checks marked 🆕)
- Mobile + desktop screenshots, pixel-diff against baseline
- 🆕 Baseline freshness warn if > 14 days old (stale baselines freeze in bugs)
- Day cards width sane (desktop)
- No JS console errors (filters 3rd-party + intentional test-path logs)
- 🆕 **All landing internal links resolve** — nav, pricing, footer, CTAs (not just demo-trip)
- Landing demo-trip links resolve in backend
- 🆕 **All background-image URLs resolve 200** (hero cycle, archetype tiles, dest gallery) — catches Unsplash ID rot like the Bali bug
- 🆕 **Critical helper functions on `window`** — `parseBudgetToRM`, `formatHomeCurrency`, `openMore`, `exportTripIcs`, etc. Catches the "trapped inside DOMContentLoaded closure" scope bug.
- 🆕 **Budget hero ≠ 0 when rows present** — catches silent currency-parse failures
- 🆕 **OG meta present on `/`, `/plan`, `/trip`, `/mytrips`** — og:title / og:description / og:image / twitter:card

**Phase 2 — drill-in surfaces**
- Day sheet / Edit modal / Packing modal / FAB-expanded all render
- Photospot aspect ratios sane
- No Light/Dark toggle (dark-only brand compliance)

**Phase 3 — interactive states**
- Archetype pill solo/family active-state transitions
- Conditional fields reveal on archetype switch (child ages etc.)

**Phase 5 — design compliance**
- No AI-slop `47++`
- Emoji glyphs color-render (catches text-variant fallback without U+FE0F)
- No invisible touch-blockers (opacity:0 + pointer-events:all)
- Cormorant Garamond loaded
- All core tap targets ≥44px
- Save trip reachable in More (catches viewer-mode hiding Save)
- mytrips login paths present
- FAB does NOT overlap More menu
- Viewer banner dismissible ≥44px close
- Budget tab renders data or actionable empty state
- Packing modal loads without API 400

### Layer 2 — Backend API smoke (`tests/qa-loop/api-smoke.sh`)

15 endpoints curled + shape-checked in ~10s:
health / stats / trip (good+bad id) / og / packing (good+bad date) / user/me / user/trips / user/oauth / admin/analytics / stripe/checkout / push/public-key / push/send-daily / save (round-trip).
Accepts graceful 503 (stripe_not_configured, push_not_configured) — fails only on unexpected shape.

### Layer 3 — Frontend journeys (`tests/qa-loop/run.mjs`)

25 scripted user flows:

| Area | Journeys |
|---|---|
| Navigation | landing-see-demo, landing-all-destinations-resolve, dest-gallery-carries-dest-param, tabs-all-switchable |
| Save & auth | more-menu-has-save, mytrips-auth-paths |
| Budget | budget-tab-usable, currency-chip-updates-hero, mark-booked-moves-row |
| Days & itinerary | days-tab-has-events, day-sheet-has-timeline |
| Tickets / Packing | tickets-no-meals, packing-no-400 |
| FAB / overlays | fab-no-overlap-more, cold-viewer-banner-dismiss |
| Plan form | plan-form-prefills, plan-archetype-switch-conditional, plan-submit-validation |
| AI edit | ai-edit-works |
| Calendar / Reminders / Share | calendar-export-reachable, reminders-button-present, share-link-reachable |
| Edit / Monetization / SOS | edit-trip-modal-opens, upgrade-to-pro-graceful, sos-tab-has-content |

### Layer 4 — Exhaustive crawler (`tests/qa-loop/explore.mjs`)

~96 visible buttons/links clicked across 5 pages. Fails on any JS exception,
new real console error, or visible "API error"/"Could not load" after click.

---

## Catching functional bugs, not just visual ones

The audit evolved from pure pixel-diff into a multi-layer system because **"rendered"
≠ "correct"**. Every time a bug made it past the audit, the check was too loose —
it asserted presence, not behavior. Five patterns for writing checks that actually
catch functional bugs:

### 1. Contract checks (backend → DOM consistency)

Compare what the backend returned against what the DOM rendered. If they drift, the
audit fails. Currently enforced on the fixture trip:

- Day count: `backend.days.length === DOM day-big-cards`
- Budget count: `backend.budget.length === DOM budget-rows`
- Trip name: `backend.trip.name` appears in `document.body.innerText` or `<title>`
- Currency: `trip.currency === every .budget-amount[data-src]`
- Budget sum: `hero total ≈ sum of row amounts (within 2%)`

Pattern: *"Whatever the backend says exists, must appear in the DOM with the right count and sum."*

### 2. Outcome checks (click does what it promises)

Don't assert `#button exists`. Assert `click #button → expected state change`.

Examples added:
- `mark-booked-actually-flips` — click Mark Booked, then: pending count ↓ AND booked count ↑
- `currency-chip-hero-actually-changes` — click JPY, then: hero contains ¥ AND hero text != before
- `ai-example-chip-fills-input` — click a chip, then: input value length > 5

Pattern: *"If a button exists, clicking it must change state in the way a user would expect."*

### 3. Red-team mutation tests (`tests/qa-loop/redteam.mjs`)

Seeds intentionally-broken data, reloads, runs the same assertions the audit uses.
If audit passes on broken data, the check is too lenient. Current mutations:

- `all-zero-budget` — every budget item has amount `$0` → audit must fail the hero-non-zero check
- `empty-day-timelines` — all days have `timeline:[]` → days-tab-has-events must fail
- `name-missing-from-dom` — sentinel string in trip.name → must appear in DOM
- `currency-mismatch` — EUR trip with no amount symbols → data-src must still be EUR

Pattern: *"Before you trust an audit check, verify it fails when it should."*

### 4. Property-based assertions (universal truths, not thresholds)

Prefer stricter invariants over bounded thresholds:

| Too loose | Tight property |
|---|---|
| `hero number > 0` | `hero number === sum(row amounts) ±2%` |
| `>= 1 day card present` | `day card count === backend.days.length` |
| `body contains 'Paris'` | `body contains backend.trip.name exactly` |
| `.budget-row.budget-pending ≥ 1` | `pending + booked === backend.budget.length` |

Pattern: *"Every threshold can be gamed by a partial render. Every identity cannot."*

### 5. Class of bug, not instance of bug

When a bug slips through, don't just patch the instance — identify the *class* and
close all of it.

Example: Bali returned 404 → class is "Unsplash ID rot / any CDN URL breaks silently
with gradient fallback." Fix: enumerate every `background-image: url()` on the landing,
curl all, fail on any non-200. One check, whole class closed.

Another: `parseBudgetToRM` trapped in DOMContentLoaded scope → class is "critical helpers
inadvertently function-scoped instead of global." Fix: list the critical helpers + assert
`typeof window[x] === 'function'` for each.

Pattern: *"After each bug, write one check that catches every variant of it."*

## Gap analysis — known limitations

Honest list to keep closing over time:

- **Cross-browser beyond Chromium** — Chromium-only. Safari emoji / `:has()` / `backdrop-filter` quirks can still surface.
- **Performance** — no LCP/CLS/TBT thresholds.
- **True offline replay** — SW trusted; no airplane-mode simulation.
- **Accessibility** — no aria/focus-order/screen-reader audit. 44px tap target is our only a11y gate.
- **SW cache version** — no automated check that `CACHE_VERSION` is bumped when HTML changes.
- **Frontend → backend payload shape** — API smoke validates response; journeys catch wrong frontend requests, but only via the UI (not the raw shape).
- **Destructive ops confirmation** — crawler skips delete/sign-out by pattern; no positive test.
- **Image content quality** — we check URL resolves, not that the photo is thematically right.
- **Email magic-link delivery** — only validates the endpoint accepts the request, not that the email arrives.

**Rule of thumb when a bug slips through**: (a) ship the fix, (b) add the check that would have caught it, (c) update this list.

## Checklist for humans (quick-ref)

- [ ] Run `./tests/visual/audit.sh --quick` → exit 0
- [ ] Run `./tests/qa-loop/loop.sh` → exit 0 (all three phases)
- [ ] Review `reports/<stamp>/audit.html` side-by-side diff grid
- [ ] Confirm any flagged "intentional" diffs against DESIGN.md
- [ ] If archetype-touching change: run `./audit.sh --archetypes`
- [ ] If design-token change: run `./audit.sh --full`
- [ ] Promote baseline only after all gates pass AND you've reviewed the diff grid

---

## Links

- **Checklist (expanded):** [`docs/audit-checklist.md`](audit-checklist.md)
- **Design source of truth:** [`DESIGN.md`](../DESIGN.md)
- **Implementation plan:** [`IMPLEMENTATION.md`](../IMPLEMENTATION.md)
- **Existing visual harness:** [`tests/visual/README.md`](../tests/visual/README.md)
- **Previous audit reports:** `docs/VISUAL_AUDIT_*.md`
