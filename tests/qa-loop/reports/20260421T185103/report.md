# Tripva QA loop — 20260421T185103

- Site: https://tripva.app
- Viewport: 390x844
- Passed: 11 / 12
- Failed: 1 (1 critical)

## Results

✅ **landing-see-demo** — Landing → 'See full demo' opens a real trip
✅ **more-menu-has-save** — More menu on trip has Save, Upgrade, Calendar, Edit
✅ **fab-no-overlap-more** — FAB hidden when More menu open
✅ **budget-tab-usable** — Budget tab either renders rows or actionable empty state
✅ **packing-no-400** — Packing modal loads without API 400
✅ **mytrips-auth-paths** — mytrips has Google + magic-link signin
✅ **tickets-no-meals** — Tickets tab does not list meal items
✅ **plan-form-prefills** — plan.html deep-link pre-fills dest + archetype
🔴 **days-tab-has-events** — Days tab shows per-day timeline items (not empty)
   - JS expr not true — got 'false'
   - Screenshot: `tests/qa-loop/reports/20260421T185103/days-tab-has-events.png`
   - Console: `tests/qa-loop/reports/20260421T185103/days-tab-has-events.console.txt`
✅ **day-sheet-has-timeline** — Opening Day sheet shows timeline items
✅ **landing-all-destinations-resolve** — All destination gallery tiles link to plan.html
✅ **tabs-all-switchable** — All 5 bottom-nav tabs switch without error

## Reproduce

```bash
node tests/qa-loop/run.mjs --only=<id>
```
