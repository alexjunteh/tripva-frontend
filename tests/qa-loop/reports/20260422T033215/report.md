# Tripva QA loop — 20260422T033215

- Site: https://tripva.app
- Viewport: 390x844
- Passed: 25 / 25
- Failed: 0 (0 critical)

## Results

✅ **landing-see-demo** — Landing → 'See full demo' opens a real trip
✅ **more-menu-has-save** — More menu on trip has Save, Upgrade, Calendar, Edit
✅ **fab-no-overlap-more** — FAB hidden when More menu open
✅ **budget-tab-usable** — Budget tab either renders rows or actionable empty state
✅ **packing-no-400** — Packing modal loads without API 400
✅ **mytrips-auth-paths** — mytrips has Google + magic-link signin
✅ **tickets-no-meals** — Tickets tab does not list meal items
✅ **plan-form-prefills** — plan.html deep-link pre-fills dest + archetype
✅ **days-tab-has-events** — Days tab shows per-day timeline items (not empty)
✅ **day-sheet-has-timeline** — Opening Day sheet shows timeline items
✅ **landing-all-destinations-resolve** — All destination gallery tiles link to plan.html
✅ **currency-chip-updates-hero** — Budget FX chip flips hero totals to selected currency
✅ **mark-booked-moves-row** — Mark booked button flips row from pending to booked section
✅ **calendar-export-reachable** — Calendar (.ics) button present in More menu + Day sheet
✅ **plan-archetype-switch-conditional** — Plan form switching archetypes reveals archetype-specific fields
✅ **plan-submit-validation** — Plan submit without destination surfaces validation
✅ **reminders-button-present** — 🔔 Reminders button shows in More menu
✅ **edit-trip-modal-opens** — Edit Trip button opens modal with fields pre-filled from plan
✅ **upgrade-to-pro-graceful** — Upgrade to Pro shows graceful 'not ready' toast (no Stripe env yet)
✅ **cold-viewer-banner-dismiss** — Cold-viewer banner has dismissible close (regression guard)
✅ **share-link-reachable** — Share button in More menu triggers share flow
✅ **dest-gallery-carries-dest-param** — Destination gallery tile URLs include dest= query param
✅ **sos-tab-has-content** — SOS tab shows emergency info for the destination
✅ **ai-edit-works** — AI Edit chat opens + example chips appear + input focusable
✅ **tabs-all-switchable** — All 5 bottom-nav tabs switch without error

## Reproduce

```bash
node tests/qa-loop/run.mjs --only=<id>
```
