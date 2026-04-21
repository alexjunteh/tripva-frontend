# Morning brief — Tripva UI/UX overhaul

**Session:** 2026-04-20 18:25 → 19:22 UTC (2026-04-21 02:25 → 03:22 MYT). ~1h of work.
**Live site:** https://tripva.app
**Commits pushed (6):**

| SHA | Phase | What |
|---|---|---|
| `0755e94` | — | DESIGN.md v2 + IMPLEMENTATION.md + PROGRESS_JOURNAL |
| `aeac6a4` | (a) | Landing — archetype grid + section consolidation |
| `e0ab0cd` | (a2) | Plan form — archetype selector + progressive disclosure |
| `ff4b6c0` | (d) | Now tab — FocusCard + StageStrip + PeekNext |
| `3390a0d` | (d) fix | Rename IDs to `nowFocus-*` (collision with legacy) |
| `d5a36c4` | (d) fix | Derive day dates from trip.startDate when missing |

---

## What shipped

### 1. Archetype-first product segmentation
Six traveler lifestyles are now the primary product dimension — landing, plan form, and backend payload all understand them:
1. **Solo explorer**
2. **Couple / romance**
3. **Family with kids**
4. **Friend group**
5. **Adventure / outdoor** (v1 fallback; full spec in DESIGN.md for follow-up)
6. **Digital nomad / slow travel** (v1 fallback)

### 2. Landing page — 7 sections → 5
- **Hero** (unchanged)
- **Archetype grid** NEW — 6 photo tiles, tap → `/plan?archetype=<id>`
- **Watch** (simplified demo, kept)
- **Proof & Price** — testimonials merged into pricing section
- **Final-CTA** (unchanged)

Removed: standalone Pain, standalone How-it-works, standalone Testimonials.

Added CSS fade-in safety-net (SO that headless screenshot captures don't hang at `opacity:0` for below-fold elements).

### 3. Plan form — archetype selector + conditional fields
- Archetype pill row at the top (horizontal scroll on mobile)
- Reads `?archetype=<id>` from URL (defaults to `couple`)
- **Solo** reveals: accommodation type, pace, safety-priority slider
- **Couple** reveals: occasion, accommodation, dining-priority slider
- **Family** reveals: child-ages repeater (max 6 kids), stroller toggle, kid-pace toggle, dietary notes
- **Friends** reveals: shared-accom toggle, decision-style, group-energy
- **Adventure / Nomad** use a v1 fallback with a "coming soon" notice + minimal controls
- Traveller count auto-seeds per archetype (solo:1, couple:2, family:4, friends:4)
- Interests chip set is archetype-specific (7 chips per type, 2–3 pre-selected as sensible defaults)
- **Submit payload now includes `archetype` + archetype-specific fields** — backend currently ignores unknown fields safely; the quality leap happens when the backend PR lands (see "Deferred work")

### 4. Now tab — FocusCard + StageStrip + PeekNext (DESIGN.md v3 pattern)
The `#tab-plan` (Live tab) gets a `.now-v3` class which hides the legacy v2-hero + liveNowCard + progress-row in favour of:

- **FocusCard** — 60vh mobile / 420px desktop, full-bleed destination photo, kicker pill ("📍 TODAY"), editorial title (Cormorant Garamond), countdown ("Day 1 of 2", "Leave in 14 min · 13:42"), single primary CTA
- **StageStrip** — horizontal chip row below FocusCard, `done` / `current` / `future` states, auto-scrolls current into view
- **PeekNext** — one preview card ("Up next: Seine cruise · 14:30")
- **Contextual alert** — optional weather/transit banner, shown only when relevant

States implemented tonight:
- **Pre-trip** (> 24h to departure): "⏳ UP AHEAD · Paris · Starts in 3 days" + "Open packing list" CTA
- **On-trip day N** (timeline-driven): beforeDay / currentItem / afterDay / fallback branches
- **Post-trip** (final day past): "✨ RECENTLY · Your Rome trip · 8 days complete" + "View scrapbook" CTA

Travel-day and final-day-specific variants fall back to on-trip rendering — fine-grained states are a v2 polish pass.

Motion: 800ms hero crossfade on state change, 1.6s gold-pulse on kicker dot, 1.8s purple-pulse on current stage chip — all respect `prefers-reduced-motion`.

---

## Verified end-to-end

Generated a real Barcelona 2-day trip via `/plan?archetype=family` → backend streamed → `/trip?id=871ef37957516825f0f8df718f838b7b` rendered:

- Archetype grid renders on landing mobile+desktop ✅
- Plan form family view shows child-ages repeater, kid-pace toggle, family interests ✅
- Submit with `archetype:"family"` payload accepted by backend ✅
- Trip dashboard FocusCard renders: `📍 TODAY · Arrival in Barcelona · Day 1 of 2 · Exploring the vibrant city · Open itinerary →` ✅
- StageStrip renders day-level chips (Day 1 / Day 2) since this short trip has no timeline ✅

Screenshot: `tests/visual/baseline/mobile/*.png` and `tests/visual/baseline/desktop/*.png` are the post-overhaul baseline.

---

## Verification harness

`tests/visual/` — mobile (390×844) + desktop (1280×800) visual regression:
- `capture.sh` — iterates 5 routes, 2 viewports, writes to `latest/`
- `compare.sh` — ImageMagick pixel diff against `baseline/` with 2% fuzz and 2% area threshold, writes `reports/<stamp>/index.html` side-by-side contact sheet
- `promote.sh` — `latest/` → `baseline/`
- Current baseline reflects the overhaul

Run:
```
cd tests/visual
./capture.sh   # snapshot current live state
./compare.sh   # diff report; exits 1 if any route over threshold
./promote.sh   # if you agree with the diff, promote to baseline
```

Pre-existing `browse` tool at `~/.claude/skills/gstack/browse/dist/browse` handles navigation + screenshots.

---

## Deferred work (explicitly out of tonight's scope)

| # | Item | Why deferred | Effort (CC) |
|---|---|---|---|
| 1 | ~~**Backend prompt branching by archetype**~~ ✅ **SHIPPED 2026-04-21** — `Tripva-backend` master `900df3f` + `7f1e2c0`. Schema accepts all 6 archetypes + specific fields; prompt branches per archetype; `trip.archetype/travelers/people/child_ages/dates` persist; `/api/packing` now live. Verified end-to-end with Lisbon family trip. | — |
| 2 | **App shell 8 → 5 tab merge** (Live / Plan / Book / Money / More) | `trip.html` is 4.5k inline lines; collapsing 8 tabs into 5 with content merges is a dedicated surgery pass | ~2–4 hours |
| 3 | **Adventure + Nomad archetype flows** | V1 fallback ships tonight; full conditional fields (gear lists, wifi audit, weekly rhythm) deferred | ~1 hour each |
| 4 | **Six-archetype Watch demo loops** | Landing shows one static demo; animated per-archetype loops deferred | ~2–3 hours |
| 5 | **Full Now-tab 5-state machine** — travel-day and final-day variants | Pre-trip + on-trip + post-trip ship tonight; travel-day and final-day fall back to on-trip | ~1–2 hours |
| 6 | **Scroll-hide bottom nav on Now tab** (focus mode) | DESIGN.md calls for this; deferred with other Now-tab polish | ~30 min |
| 7 | **Curated destination imagery** | Landing archetype tiles and FocusCard fallback use `picsum.photos` seeds — stable + reliable but generic | ~content pass |

---

## Outstanding audit items (fresh, spotted during live verification)

1. **Empty timeline for short trips** — the 2-day Barcelona trip the Claude backend generated had `timeline: []` on both days. FocusCard falls back to day-level "Day 1 of 2" chips, which is fine. But the packing list + ticket rows are present alongside. Backend prompt should be told to always produce at least 3–5 timeline items per day. This belongs with backend work item #1 above.
2. **`_usedDayImgs` TDZ warning** in the legacy `?demo=1` code path — pre-existing, only fires in the demo flow, not on real trips. Harmless, but worth cleaning up when someone next touches that block.

---

## Files of note

- **[`DESIGN.md`](../DESIGN.md)** — the design source of truth. 6 archetypes, IA cuts, component specs, anti-patterns.
- **[`IMPLEMENTATION.md`](../IMPLEMENTATION.md)** — phase plan with acceptance criteria (phases a / a2 / d done; b / c deferred).
- **[`docs/research/reference-apps-2026-04-21.md`](research/reference-apps-2026-04-21.md)** — the 10-app reference research (Wanderlog, TripIt, Google Trips, Duolingo, Headspace, Airbnb Trips, Citymapper, Uber, Transit, Apple Fitness+) + 7 cross-cutting patterns.
- **[`docs/PROGRESS_JOURNAL.md`](PROGRESS_JOURNAL.md)** — running log of the overnight session, most recent first.
- **[`docs/reference/`](reference/)** — frozen v1 copies of `index.html`, `plan.html`, `trip.html`, `mytrips.html` for emergency restoration.
- **[`tests/visual/`](../tests/visual/)** — visual regression harness.

---

## If you want to rollback

Any commit can be reverted individually:
```
git revert <sha>
git push origin main
```

Pre-overhaul snapshot is commit `7440e0a` (baseline of the visual harness setup) — prior to any visual changes.

The four frozen v1 HTMLs under `docs/reference/` are also there as a last-resort manual restore.

---

## Recommended next session

1. Clone `Tripva-backend` locally → branch the Claude system prompt by archetype → ship that PR
2. Land the app-shell 8 → 5 tab collapse in its own dedicated pass
3. Swap `picsum.photos` archetype tile images for curated destination photography
4. Ship the 6 Watch-demo loops for the landing

Each is independently shippable. Ask when you want to kick off.
