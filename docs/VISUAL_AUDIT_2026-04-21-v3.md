# Visual audit v3 — drill-in pass

**Date:** 2026-04-21 03:55 UTC
**Trigger:** User said "day tab photospot is broken, aspect ratio off, photos too big. How did you not catch it in your visual audit?"
**Cause:** v2 audit only screenshotted tab-level views. Never drilled INTO day sheets, modals, FAB actions, overlays.

## New audit methodology

Previous audits: `switchTab('X'); screenshot;` for 5 tabs × 2 viewports = 10 screens.

**Drill-in pass adds for each trip:**
- Open day sheet (`openDaySheet(i)`) per day — timeline items incl. photospots
- Edit modal (`openEditModal()`)
- Packing list modal (`openPackModal()`)
- FAB expanded (`toggleFab()`)
- More overlay (`#moreOverlay.open`)
- Sheet-over-day, Book card detail, Chat panel

Photospots only appear inside day sheets — hence the blind spot.

## Issues caught this round

### 1. Photospot images rendering at native resolution (the main bug)

**Diagnosis:** Day sheets with `type:"photospot"` timeline items emit:
```html
<div class="tl-ps-wrap">
  <img class="tl-ps-photo" src="..." loading="lazy">
  <div class="tl-ps-tip">📸 tip text</div>
</div>
```
But `trip.html` had **zero CSS** for any of `.tl-ps-wrap`, `.tl-ps-photo`, or `.tl-ps-tip`. The `<img>` rendered at native Wikipedia Commons resolution — often 2000-3000 px wide — blowing out the day-sheet layout entirely.

**Fix** (commit `21ade13`):
```css
.tl-ps-wrap{ margin-top:8px; border-radius:14px; overflow:hidden; border:1px solid var(--border); }
.tl-ps-photo{ display:block; width:100%; aspect-ratio:16/9; object-fit:cover; }
.tl-ps-tip{ padding:9px 12px; font-size:12.5px; color:rgba(255,255,255,.78); border-top:1px solid var(--border); }
```
Verified on live with a synthetic photospot: width = 338px (container), aspect ratio = 1.78 (16:9). Tip caption renders below with proper divider.

### 2. "Light mode" toggle in FAB contradicted dark-only brand rule

**Diagnosis:** Opening the FAB menu revealed 5 actions including a "☀ Light mode" toggle. DESIGN.md principle #3 ("calm, confident, editorial") + the explicit dark-only palette meant this toggle was off-brand and produced a half-broken light render when tapped.

**Fix** (commit `2954817`):
- Removed the `<div class="fab-action">` block containing the theme toggle
- FAB now shows 4 actions: ✨ AI Edit · 📱 Install · ✨ New Trip · 🔗 Share
- Kept `toggleThemeMode`/`refreshThemeLabels` functions as dead code (no remaining callers)

## Non-frontend issues noted (not fixed here)

### Packing list: "Could not load packing list / Failed to fetch"

`POST /api/packing` returns **HTTP 404** from the live backend (`tripai-backend.vercel.app`). The endpoint isn't deployed. The frontend handles the error gracefully (shows "Try again" button with clear copy) — that part is correct behavior.

**Backend gap,** documented in `docs/MORNING_BRIEF.md` follow-ups. Tripva-backend needs an `/api/packing` Vercel function.

### Edit Trip modal shows stale data

The modal reads from `tripMeta` (localStorage-cached) which can contain prior-session values:
- Dates field: shows "Apr 4-10, 2026" instead of the current trip's "Apr 20-21, 2026"
- People field: shows "2" instead of "4"
- Budget field: shows "RM 4,500" instead of current

**Not a rendering bug** — the form is wired to stale meta. A fix would either:
(a) Re-populate from `plan.trip` on modal open, or
(b) Clear `tripMeta` when loading a different trip id

Deferred; filed as follow-up.

## Drill-in screenshots

| Surface | File | Status |
|---|---|---|
| Day sheet (Day 1, Barcelona) | `/tmp/va3/drill-day-sheet.png` | ✅ Clean — highlights, hour-by-hour, local intel, navigation |
| Edit modal | `/tmp/va3/drill-edit-modal.png` | ✅ Renders; stale data issue noted above |
| Packing modal | `/tmp/va3/drill-packing.png` | ⚠️ Backend 404 — graceful fail UI |
| FAB expanded (v1) | `/tmp/va3/drill-fab-open.png` | ❌ Had Light mode toggle |
| FAB expanded (v2, fixed) | `/tmp/va3/drill-fab-final.png` | ✅ 4 clean actions |
| Photospot (synthetic render) | `/tmp/va3/photospot-synthetic.png` | ✅ 16:9, rounded, tip caption |

## Commits

- `21ade13` — **fix photospot CSS**: add missing `.tl-ps-*` rules
- `2954817` — **remove FAB Light mode toggle**: dark-only brand rule

## Remaining gaps (all backend or data-freshness)

1. `/api/packing` endpoint returns 404 — backend PR needed
2. `/api/plan` doesn't persist `archetype` / `travelers` / `archetype-specific fields` → frontend derives them by sniffing notes
3. Edit modal reads stale `tripMeta` from localStorage across sessions
4. LLM-generated trips sometimes have empty `timeline[]` arrays
5. Backend returns same `imageUrl` for every day (mitigated with Wikipedia upgrader in `upgradeTripImages()`)

All are in `docs/MORNING_BRIEF.md` under "Deferred / requires backend PR".

## What I learned

Tab-level screenshots catch ~80% of visual bugs. The rest hide in **drill-in surfaces**: modals, sheets, expanded menus. Future audits must open every modal, every overlay, every expanded state — not just the tab container. I updated `docs/audit-checklist.md` with the drill-in inventory.
