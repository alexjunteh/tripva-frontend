# IMPLEMENTATION.md — Tripva UI/UX overhaul

_Created 2026-04-21. Backed by [`DESIGN.md`](./DESIGN.md) v2 (archetype-tailored)._

---

## Scope summary

Four separable phases, ordered for risk-minimization:

| Phase | Surface | Risk | Tonight |
|---|---|---|---|
| **(a)** Landing redesign + archetype grid | `index.html` | Low (marketing surface, no state) | ✅ ship |
| **(a2)** Plan form: archetype selector + progressive disclosure | `plan.html` | Medium (form-state logic) | ✅ ship |
| **(b)** App shell — tab collapse 8 → 5 | `trip.html` (structural) | **High** (touches 4.5k-line file structurally) | 🔜 deferred |
| **(c)** Backend prompt branching by archetype | `Tripva-backend/lib/prompt.js` | Not local — needs a separate PR | 🔜 deferred (frontend emits `archetype`; backend can ignore safely) |
| **(d)** Now tab redesign — FocusCard + StageStrip | `trip.html` (CSS + markup, scoped) | Medium | ✅ ship (on-trip + pre-trip states; other states 🔜) |

---

## Global invariants (across all phases)

- No framework change. Static HTML + vanilla JS. No bundler.
- No edits to the backend API contract beyond adding `archetype` + `modifiers[]` to the POST body. Backend currently ignores unknown fields safely (verified by reading `lib/claude.js` request flow).
- CSS tokens live inline in each HTML file (no shared stylesheet — project convention). Tokens from `DESIGN.md` are repeated in each file's `<style>` block.
- Every visual-changing commit runs `tests/visual/capture.sh` + `compare.sh` before push. The contact-sheet report is saved in `tests/visual/reports/`.
- Every commit is pushable on its own — no half-states.
- Accessibility gates: 44×44 tap targets, WCAG AA contrast, `prefers-reduced-motion`, safe-area insets.
- Mobile-first (390×844), desktop first-class (1280×800+).
- Trip-planning business logic is **not** touched in phases (a), (a2), or (d) — even for fields like `archetype` that are new, they are added to the payload only, not branched in backend logic tonight.

---

## Phase (a) — Landing redesign with archetype grid

### Deliverable

Updated `index.html` that shows:
1. Hero
2. **Archetype grid** (NEW — 6 tiles, photo + 2-word label, tap → `/plan?archetype=<id>`)
3. Watch (demo — simplified to one loop v1; six-archetype cycling deferred)
4. Proof & Price (merged)
5. Final-CTA + footer

Removed sections: standalone "Pain," standalone "How it works," standalone "Testimonials."

### Acceptance criteria

- [ ] Archetype grid renders 6 tiles at 2 cols on mobile (390), 3 cols on desktop (≥900)
- [ ] Each tile has a photo, a label, a 1-line subtitle
- [ ] Each tile routes to `/plan?archetype=<id>` where id ∈ `{solo, couple, family, friends, adventure, nomad}`
- [ ] Pricing section lives immediately below testimonials / social proof (merged section)
- [ ] Landing total content sections = 5 (Hero / Archetype / Watch / Proof & Price / Final-CTA) + footer
- [ ] Mobile viewport 390×844: no content clipped, no horizontal scroll
- [ ] Desktop viewport 1280×800: archetype grid at 3×2, no awkward empty columns
- [ ] Lighthouse-style basics: all images have alt text, primary CTA is `<a>` or `<button>` (not `<div>`)
- [ ] Visual diff shows the structural change (expected ≥30% pixel difference from v1 baseline — this is intentional)
- [ ] No JS console errors
- [ ] Existing Plausible analytics script preserved

### Non-goals

- Video / animated demo loops — v1 shows one static "plan appearing" demo; six-archetype cycling is v2.
- A/B testing of copy — use current "Plan your trip in seconds" or minor variant.
- Pricing table design change — keep existing structure, just reposition into merged section.

---

## Phase (a2) — Plan form with archetype selector + progressive disclosure

### Deliverable

Updated `plan.html` that:
1. Reads `?archetype=<id>` from URL on load (default: `couple` if missing — most common archetype).
2. Shows an **archetype selector** at the top of the form (6 visually selectable pill-tabs, current is filled).
3. Tapping an archetype reveals the **relevant form fields** (progressive disclosure) and hides others.
4. Emits `archetype` + `modifiers[]` in the `POST /api/plan` body (backward-compatible — the current backend ignores unknown fields).
5. Submit button stays at the bottom; the archetype-specific fields flow between universal fields and the submit.

### Acceptance criteria

- [ ] URL `?archetype=solo` loads the form pre-selected on "Solo explorer"
- [ ] URL with invalid/missing archetype defaults to "Couple" and shows the selector
- [ ] Archetype selector is visible at top of form, horizontally scrollable on mobile
- [ ] Selecting a different archetype re-renders the conditional fields within 200ms (no blank flash)
- [ ] Four archetypes (solo, couple, family, friends) have their full conditional field sets wired up
- [ ] Two archetypes (adventure, nomad) use a fallback generic field set with a gentle "more options coming soon" note
- [ ] Submitting the form sends `archetype` and `modifiers[]` in the JSON POST body (verify via network tab)
- [ ] Existing backend call path unchanged — current baseline trips still generate with `?archetype` missing (graceful)
- [ ] Interests chip set updates per archetype
- [ ] Family archetype has a `child_ages[]` repeater (add/remove up to 6)
- [ ] Tap targets remain ≥44px on all inputs
- [ ] Sticky submit button clearance preserved (from earlier audit work)

### Non-goals

- Storing the chosen archetype in localStorage across sessions (v2).
- Full adventure/nomad archetype flows — these are stubbed.
- Backend prompt branching — flagged, not done.

---

## Phase (d) — Now tab redesign (FocusCard + StageStrip)

### Deliverable

Updated `trip.html` `#tab-plan` (renamed to "Now" in UI, id preserved internally for minimal diff). Ships two states:
1. **Pre-trip** (> 24h to departure) — FocusCard showing countdown to departure + "Prep" stage
2. **On-trip** (trip has started, current day detected) — FocusCard showing current/next activity with countdown, below: StageStrip (today's activities), PeekNext (one card)

Other states (travel-day, final-day, post-trip) are deferred to a follow-up session — current fallback rendering continues to work.

### Acceptance criteria

- [ ] `#tab-plan` renders the new FocusCard markup when trip data is loaded
- [ ] FocusCard height ≥ 60vh mobile, ≤ 420px desktop
- [ ] FocusCard shows: full-bleed hero image + kicker + title + countdown + primary CTA
- [ ] FocusCard hides old `liveNowCard`, `liveHero`, and sub-components (keep in DOM for other-tab fallback if needed, but hidden from Now tab)
- [ ] StageStrip renders as a horizontal scrollable chip row below the FocusCard with done/current/future states
- [ ] PeekNext renders one small card for the next activity (if any)
- [ ] Countdown text updates every 60s minimum
- [ ] Pre-trip state triggers when all days' dates are in the future
- [ ] On-trip state triggers when today ∈ trip dates
- [ ] Empty state (no trip loaded) shows existing "No plan yet" empty state — no regression
- [ ] Visual regression: mobile + desktop screenshots match DESIGN.md spec
- [ ] No JS console errors; existing trip-loading flow is untouched
- [ ] `fab-main` (redesigned earlier) remains above bottom nav, no overlap

### Non-goals

- Travel-day / final-day / post-trip FocusCard variants (deferred).
- Day-change midnight animation (deferred).
- Scroll-hide for bottom nav on Now tab (deferred).
- Day progress ring at card corner (deferred).
- Changes to `#tab-days`, `#tab-tickets`, `#tab-hotels`, `#tab-budget` (explicitly out of scope).

---

## Phase (b) — App shell tab collapse [DEFERRED]

### Rationale for deferring

The current `trip.html` has 8 tabs rendered as 8 separate `.tab-content` divs, each with ~200–600 lines of inline JS and HTML. Collapsing to 5 tabs requires:
- Renaming tabs (cosmetic, low risk)
- Merging content of `tab-trip` into `tab-days` (Plan tab) — structural
- Merging content of `tab-tickets` and `tab-hotels` into a new "Book" tab — structural
- Reworking the `switchTab()` flow and bottom-nav markup

This is a ~2–4 hour careful surgery job in a 4.5k-line inline file. Doing it on the same overnight as landing+plan+Now tab work creates a merge-conflict minefield. Deferring to a dedicated follow-up session. For tonight, the bottom nav keeps its current 5-visible-tabs layout (Live / Days / Tickets / Budget / More), which already works.

### Acceptance criteria (for follow-up)

- [ ] Bottom nav shows exactly 5 tabs: Now · Plan · Book · Money · More
- [ ] Tapping each tab routes to the merged content (Plan = old Trip + Days; Book = old Tickets + Hotels)
- [ ] No regression in any existing tab's functionality
- [ ] URL state for tabs preserved (if used)

---

## Phase (c) — Backend prompt branching [DEFERRED]

### Rationale for deferring

The backend repo (`github.com/alexjunteh/Tripva-backend`) is not checked out locally. It lives as a deployed Vercel project at `tripai-backend.vercel.app`. To branch the Claude system prompt by archetype requires editing `lib/prompt.js` and `lib/schema.js` in that repo.

For tonight, the frontend emits `archetype` + `modifiers[]` in the `POST /api/plan` payload. The current backend will ignore these fields (verified safe — backend uses explicit destructuring). So the end-to-end flow works; the backend just produces a "generic" plan for all archetypes until the follow-up PR lands.

### Follow-up PR scope (for `Tripva-backend`)

- [ ] `api/plan.js`: accept and validate `archetype` and `modifiers[]` fields from request body
- [ ] `lib/prompt.js`: add 6 archetype-specific system prompt fragments (~50–100 words each), composed with the base prompt
- [ ] `lib/schema.js`: add archetype-conditional output fields (nap_windows for family, etc.)
- [ ] `lib/schema.js`: tighten output schema per archetype (more specific than current generic one)
- [ ] Test plan: generate one plan per archetype for the same destination, compare outputs qualitatively — family plan should have kid-friendly meal times, adventure plan should have gear notes, etc.

This is ~2–4 hours of backend work plus manual qualitative review. Doing it well requires the Anthropic API key for test generations and is out of scope for the frontend overhaul session.

---

## Verification strategy

### Per-phase verification checklist (run after each phase's commit, before push)

1. **Local smoke test** — open the modified page in `browse` headless, capture mobile + desktop screenshots, eyeball for regressions.
2. **Visual regression harness** — run `./tests/visual/capture.sh` + `./tests/visual/compare.sh`. Review the contact sheet for diff areas, annotate expected vs unexpected.
3. **Console check** — `$B console --errors` on every changed page, must return `(no console errors)`.
4. **Tap-target audit** — use `$B js` to measure `getBoundingClientRect()` of every interactive element, flag anything < 44×44.
5. **Accessibility spot-check** — tab through the page, verify focus ring visibility and logical tab order.

### End-of-session verification (before claiming done)

1. Live site fully loaded at `tripva.app` (no broken pages, no 500s, no blank screens).
2. End-to-end: visit `/`, click archetype tile, fill plan form, submit, verify redirect to `/trip?id=...` with a generated plan.
3. Contact sheet for final run — all routes, all diffs annotated as "expected" or escalated.
4. `PROGRESS_JOURNAL.md` up to date with shipped-vs-deferred list.
5. Summary report for morning hand-off.

### Bounded fix loop (Phase 5)

- Iteration 1: catch all issues
- Iteration 2: catch regressions from iter-1 fixes
- Iteration 3: final pass
- Hard cap: 3. If issues remain, escalate with a list — no infinite looping.

---

## Commit strategy

Each commit corresponds to a phase deliverable (or a sub-step) and is pushable on its own:

1. `docs: DESIGN.md v2 + IMPLEMENTATION.md for archetype overhaul`
2. `feat(landing): archetype grid + section consolidation`
3. `feat(plan): archetype selector + progressive disclosure by traveler type`
4. `feat(trip/now): FocusCard + StageStrip + pre-trip/on-trip state`
5. `chore: update visual baseline after overhaul`

Each is verified locally and visually before push. Final commit promotes `latest/` to `baseline/` after the overhaul is approved-good.

---

## Rollback plan

If any shipped phase causes production breakage:
- `git revert <commit>` on `main`, push. Cloudflare redeploys within 30s.
- `docs/reference/*-v1-2026-04-21.html` contains a frozen copy of all 4 pages for emergency manual restoration.
- Visual baseline commit `7440e0a` is the known-good snapshot.
