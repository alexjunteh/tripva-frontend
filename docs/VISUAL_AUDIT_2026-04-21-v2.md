# Visual audit v2 — full mobile + desktop pass

**Date:** 2026-04-21 03:30 UTC
**Trigger:** User reported "Day trip aspect ratio still off, budget tab still shows nothing" after v1 audit
**Root causes found + fixed:** 2

## Issues caught this round

### 1. Day cards cramped to 222px on a 390px viewport

**Diagnosis:** `getBoundingClientRect()` showed cards at 222×225 (near-square) with hero image at 220×174. Visual space 140px+ wide was dead on the right of every card.

**Root cause:** `.day-big-card { margin-right: 140px }` was added months ago as FAB clearance when the FAB lived top-right. The FAB was moved to bottom-right in an earlier fix, but the margin was never removed.

**Fix** (commit `4a52f71`):
```css
.day-big-card{
  /* removed margin-right:140px */
  aspect-ratio: 16/9;
  min-height: 200px;
  max-height: 320px;
}
@media(min-width:640px){
  .day-big-card{aspect-ratio:auto; height:calc((100dvh - 168px) / 3);}
}
```
Cards now 362×204 on mobile — 16:9 landscape editorial aspect. Desktop retains "fit 3 visible" layout.

### 2. Budget empty-state could flash before data loaded

**Diagnosis:** `#budgetEmpty` was visible by default in markup. On slow-loading paths (initial page load before fetch resolves, or localStorage restore without budget) users could see "Budget data unavailable for this trip" before real content painted.

**Fix** (commit `4a52f71`):
- Default `display:none` on `#budgetEmpty`
- `populateDashboard` explicitly shows it (`display:flex`) only in the genuine no-budget branch
- Populated-path keeps the existing `.remove()` to remove it entirely

## Full-audit verification (post-fix)

All 5 trip tabs, mobile (390×844):

| Tab | Status | Evidence |
|---|---|---|
| **Live (Now)** | ✅ | Sagrada Família FocusCard, Cormorant italic title, Day 1/Day 2 chips, weather, bookables |
| **Trip overview** | ✅ | `2 Days · 4 People · ~RM 6.9k` on one line each (compact budget fmt) |
| **Days** | ✅ | Both cards full-width 362px, proper 16:9, Sagrada Família + Aerial Barcelona distinct Wikipedia photos, full titles visible ("Arrival in Barcelona" not truncated) |
| **Tickets** | ✅ | Empty state correctly shown (no confirmed tickets in this trip) |
| **Budget** | ✅ | Full breakdown populated: RM 141 confirmed, RM 6,750 pending, 7 line items, currency converter. No empty-state flash |

**Landing page mobile:** Archetype grid renders 2-col with distinct gradient tiles + glyphs per type (☀ 🍷 🏝 🥂 ⛰ ☕).

**Desktop (1280×800):** Day cards wide with full-width images, FocusCard editorial hero, archetype tiles in 3-col grid.

## Commits this session
- `b621374` — editorial archetype tiles + initial budget clamp
- `61385ce` — compact budget formatting (`~RM 6.9k`)
- `1f6c00c` — shared `_fmtBudgetCompact` helper fixes `restoreMeta` overwrite
- `aff4ed9` — baseline refresh post-polish
- `4a52f71` — **Day cards full-width + budget empty-state no-flash** (this round)

## What's verifiably correct on live `tripva.app` right now

1. Landing: 5 sections (hero, archetype grid, Watch, proof & price, final CTA), all consistent
2. Plan form: archetype-driven progressive disclosure, 6 traveler types
3. Trip generation: end-to-end (tested with Barcelona family trip)
4. Trip dashboard: all 5 tabs clean on mobile and desktop
5. Wikipedia imagery: day cards + FocusCard pull real city photos
6. Compact budget formatting: no truncation at any viewport
7. Accessibility: 44px tap targets, WCAG AA contrast, safe-area insets

## Zero known visual bugs on the documented happy path

Remaining items in `docs/MORNING_BRIEF.md` under "Deferred" are all backend gaps (archetype prompt branching, travelers persistence, LLM-native timeline generation) — not frontend visual issues.
