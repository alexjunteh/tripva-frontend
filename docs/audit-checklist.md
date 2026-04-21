# Visual audit checklist

Every audit pass must cover **tab-level views** + **drill-in surfaces**.
Missing the drill-in pass is why earlier audits didn't catch the photospot bug.

## Phase 1 — Tab-level (10 screens)

For both 390×844 mobile AND 1280×800 desktop, with localStorage cleared, cache-busted URL, 8s settle:

- [ ] Landing `/` — hero + archetype grid + Watch + proof & price + final CTA
- [ ] Plan form `/plan?archetype=family` — archetype selector + form fields reveal correctly
- [ ] Trip Live tab — FocusCard + stage strip + PeekNext + weather
- [ ] Trip overview tab — hero + stats + itinerary
- [ ] Trip Days tab — day cards with Wikipedia photos
- [ ] Trip Tickets tab
- [ ] Trip Budget tab
- [ ] My Trips `/mytrips` — empty state + signed-in state

## Phase 2 — Drill-in surfaces (this was the gap)

For each trip with data, open and screenshot:

- [ ] **Day sheet** (`openDaySheet(0)`, `openDaySheet(1)`, ...) — highlights, hour-by-hour timeline, photospot items, activity items, transport cards, local tips
- [ ] **Edit modal** (`openEditModal()`) — form fields populated with current trip data, save/cancel
- [ ] **Packing list modal** (`openPackModal()`) — categories, checkbox state, progress bar
- [ ] **FAB expanded** (`toggleFab()`) — all quick-actions visible + labeled correctly
- [ ] **More overlay** (More tab) — Tips / SOS / Settings
- [ ] **Book card detail** — inside Book Now / Tickets, click a card
- [ ] **Chat / AI edit panel** (`toggleAiChat()`)
- [ ] **Auth modal** on plan.html post-generate (tap a day before signing in)
- [ ] **Route map** — Leaflet render inside the trip tab

## Phase 3 — Interactive states

- [ ] Form validation — submit empty plan form, assert error toasts
- [ ] Archetype switcher — tap each of 6 pills, confirm fields change
- [ ] Child-age repeater — add / remove up to 6
- [ ] Currency converter bar — switch currencies in Budget tab
- [ ] Stage chip interaction — scroll, confirm current chip visible

## Phase 4 — Edge cases

- [ ] Empty state: visit trip id that doesn't exist
- [ ] Pre-trip state: generate trip with dates in the future
- [ ] Post-trip state: generate trip with dates in the past
- [ ] Long destination name (40+ chars)
- [ ] 12-day trip: stage strip scroll + Days list fits
- [ ] Offline / flaky network: throttle network, confirm graceful degradation

## Rules

1. Clear localStorage + sessionStorage before every pass
2. Cache-bust the URL (`?v=$(date +%s)`)
3. Sleep 6–8s after navigation for Wikipedia upgrades to land
4. Screenshot BOTH mobile and desktop for every surface
5. Use `getBoundingClientRect()` to verify dimensions match DESIGN.md specs — don't trust compressed-screenshot eyeballing
6. Run `tests/visual/capture.sh` + `compare.sh` for automated diff against baseline
