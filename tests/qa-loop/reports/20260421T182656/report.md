# Tripva QA loop — 20260421T182656

- Site: https://tripva.app
- Viewport: 390x844
- Passed: 8 / 8
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

## Reproduce

```bash
node tests/qa-loop/run.mjs --only=<id>
```
