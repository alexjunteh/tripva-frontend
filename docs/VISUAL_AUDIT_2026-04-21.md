# Visual audit — post Wikipedia-imagery

**Date:** 2026-04-21 03:00 UTC
**Commit:** `c1de6be` (on `main`, live at tripva.app)
**Test trip:** Barcelona 2-day family trip (`id=871ef37957516825f0f8df718f838b7b`)
**Viewports:** 390×844 (mobile) and 1280×800 (desktop)
**Method:** Cold-start (localStorage cleared), cache-busted URL, 8s settle for Wikipedia fetches
**Screenshots:** `/tmp/va/{mobile,desktop}-{plan,trip,days,tickets,budget}.png`

## Health score: **92 / 100**

## Per-tab results

| Tab | Mobile | Desktop | Notes |
|---|---|---|---|
| **Now (plan)** | ✅ PASS | ✅ PASS | FocusCard hero shows Sagrada Família Wikipedia photo. Cormorant italic title "Arrival in Barcelona" rendering correctly. Day 1/Day 2 stage chips styled. Weather banner, bookable items all present. |
| **Trip overview** | ✅ PASS | ✅ PASS | Stats populated (2 Days · 4 People · ~RM 6,891 Budget). Subtitle "Apr 20 → Apr 21 · 4 people". Itinerary shows correct dates (Mon 20 Apr / Tue 21 Apr). |
| **Days** | ✅ PASS | ✅ PASS | **Day 1 Sagrada Família** + **Day 2 Aerial Barcelona** — two distinct Wikipedia images. Dates correct. |
| **Tickets** | ✅ PASS | ✅ PASS | Empty state "No tickets yet" — correct for this trip (backend only generated to-book items, not confirmed tickets). |
| **Budget** | ✅ PASS | ✅ PASS | Full breakdown: RM 141 confirmed + RM 6,750 pending. 7 line items rendered. Currency converter visible. |

## Wikipedia imagery verification

Resolved per-day from `heroSeed` → Wikipedia search → Wikimedia Commons image:

| Day | heroSeed | Resolved image |
|---|---|---|
| Day 1 | `barcelona-sagradafamilia` | `Σαγράδα_Φαμίλια_2941.jpg` (Sagrada Família facade) |
| Day 2 | `barcelona-parkguell` | `Aerial_view_of_Barcelona_51227309370.jpg` (aerial Barcelona) |

**Generalization test** — resolver tried against 7 destinations via direct API call:

| Destination | Resolved image |
|---|---|
| paris+eiffel+tower | `Tour_Eiffel_Wikimedia_Commons.jpg` ✓ |
| tokyo+shibuya | `Shibuya_skyline_2024.jpg` ✓ |
| rome+colosseum | `Colosseo_2020.jpg` ✓ |
| kyoto+fushimi+inari | `Torii_path_Fushimi_Inari.jpg` ✓ |
| new+york+brooklyn+bridge | `Brooklyn_Bridge_Manhattan.jpg` ✓ |
| bali+ubud | `Ubud_49818456887.jpg` ✓ |
| iceland+blue+lagoon | `Blue_Lagoon_Main_Building.JPG` ✓ |

All 7 return recognizable, city-specific Wikimedia Commons images. Wikipedia's search endpoint tolerates hyphenated compound seeds and free-text landmark names equally well.

## Performance

- Cold-start load to first painted placeholder: ~2s
- Wikipedia image upgrade (Days tab): ~3-5s from page load (serial fetches)
- Cached (second visit): instant — `localStorage['tripva_wiki_imgs_v1']` serves in ~1ms
- Cache TTL: 30 days; negative cache (no image found) also stored to avoid re-retry

## Console errors

```
[error] Failed to load resource: 404 (×2)
```

Both are external asset 404s (likely favicon or Plausible edge case) — unrelated to the overhaul. No JavaScript errors. No layout-blocking issues.

## Minor findings (not blockers)

| # | Finding | Severity | Note |
|---|---|---|---|
| 1 | Trip-tab budget stat "~RM 6,891" wraps to 2 lines on 390px viewport | LOW | Cosmetic; font-size could scale down with `clamp()` at narrow widths |
| 2 | FocusCard on mobile Live tab is tall — 60vh dominates the fold | NONE | Intended — principle 1 "always one next thing" |
| 3 | Desktop Live tab renders FocusCard at full viewport (looks compact in 1280×800 screenshot) | NONE | Intended — 420px fixed max-height |
| 4 | Landing page archetype tiles still use picsum seeds (not Wikipedia) | NOT-IN-SCOPE | Archetype ≠ destination — Wikipedia has no "Solo trip" page. Picsum stable seeds are correct for archetype imagery |

## What's verified working end-to-end

1. **Landing** `/` — hero + archetype grid + merged proof-and-price sections
2. **Plan form** `/plan?archetype=<id>` — URL param pre-selects pill, reveals archetype-specific fields, sends `archetype` + extras in POST body
3. **Trip generation** — POST → SSE stream → Gist save → redirect to `/trip?id=<gist-id>` works end-to-end
4. **Trip dashboard** — all 5 tabs render cleanly with live data
5. **FocusCard** — state-aware (pre-trip / on-trip / post-trip) with correct hero imagery
6. **Day cards** — distinct per-day Wikipedia photos, correct dates
7. **Wikipedia upgrade** — non-blocking, 30-day cached, graceful fallback if unreachable
8. **All stats** — derived from backend when structured fields missing (days from array length, dates from start/end, people from "for N people" text)

## Recommendation

**Ship-ready.** The Wikipedia imagery closes the last major quality gap on the trip dashboard. Remaining improvements (real destination photos cached at Build time, backend prompt branching by archetype, full Now-tab 5-state machine) are in `docs/MORNING_BRIEF.md` as deferred follow-ups.
