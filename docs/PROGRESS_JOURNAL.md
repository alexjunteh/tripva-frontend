# Overnight overhaul progress journal

**Session start:** 2026-04-20 18:25 UTC (= 2026-04-21 02:25 MYT)
**Scope:** Option A — archetype-tailored UX overhaul (6 traveler types)
**Boundary:** Frontend-complete + backend-ready hooks. Backend repo not locally available; emits `archetype` in API payload for a follow-up backend PR.
**Verification:** `tests/visual/` harness after every commit that ships visual changes.

Status convention: ⏳ in-flight · ✅ done · 🔜 deferred · 🚫 blocked

---

## Tonight's delivery plan

| # | Item | Status | Notes |
|---|---|---|---|
| 1 | DESIGN.md v2 with archetypes | ⏳ | Update the design doc to include the 6 archetypes + landing/plan adaptations |
| 2 | IMPLEMENTATION.md (phase 3) | ⏳ | Structured plan with acceptance criteria per phase |
| 3 | Phase (a) — Landing redesign with archetype grid | ⏳ | Hero + Watch (or demo) + Proof & Price + Final-CTA + archetype grid |
| 4 | Phase (a2) — Plan form with archetype selector + progressive disclosure | ⏳ | 6 archetypes, 3–4 fully speccced sets of conditional fields |
| 5 | Phase (d) — Now tab FocusCard + StageStrip | ⏳ | State-aware focus card + horizontal stage chip strip |
| 6 | Visual regression at each phase boundary | ⏳ | `capture.sh` + `compare.sh` contact sheet |
| 7 | Final audit + summary report | ⏳ | Morning hand-off |

## Deferred to a follow-up session (explicitly out of tonight's scope)

- 🔜 **Phase (b) — App shell 8→5 tab merge.** Touches trip.html structure across many places; deserves its own careful pass rather than bundling with the Now tab redesign.
- 🔜 **Full Now-tab 5-state machine** (pre-trip / travel-day / on-trip / final-day / post-trip) — ship the on-trip and pre-trip states tonight; final-day + post-trip + travel-day deferred.
- 🔜 **Backend prompt branching by archetype.** Backend repo (`alexjunteh/Tripva-backend`) is not locally available. Frontend will emit `archetype` in the API payload; backend follow-up PR needed.
- 🔜 **Plan / Book / Money tab redesigns.** Out of scope per DESIGN.md.
- 🔜 **6th archetype details on plan form** — I'll fully spec 3–4 archetype flows tonight; remaining ones will use the "generic" progressive-disclosure template as a fallback.

## Running log (most recent first)

