# Tripva QA loop — 20260421T181206

- Site: https://tripva.app
- Viewport: 390x844
- Passed: 5 / 8
- Failed: 3 (3 critical)

## Results

🔴 **landing-see-demo** — Landing → 'See full demo' opens a real trip
   - selector '.tab-content.active' not present
   - Screenshot: `tests/qa-loop/reports/20260421T181206/landing-see-demo.png`
   - Console: `tests/qa-loop/reports/20260421T181206/landing-see-demo.console.txt`
🔴 **more-menu-has-save** — More menu on trip has Save, Upgrade, Calendar, Edit
   - body text missing 'Save trip'
   - body text missing 'Upgrade to Pro'
   - body text missing 'Calendar'
   - body text missing 'Edit Trip'
   - Screenshot: `tests/qa-loop/reports/20260421T181206/more-menu-has-save.png`
   - Console: `tests/qa-loop/reports/20260421T181206/more-menu-has-save.console.txt`
🔴 **fab-no-overlap-more** — FAB hidden when More menu open
   - JS expr returned '0.92877', expected '0'
   - Screenshot: `tests/qa-loop/reports/20260421T181206/fab-no-overlap-more.png`
   - Console: `tests/qa-loop/reports/20260421T181206/fab-no-overlap-more.console.txt`
✅ **budget-tab-usable** — Budget tab either renders rows or actionable empty state
✅ **packing-no-400** — Packing modal loads without API 400
✅ **mytrips-auth-paths** — mytrips has Google + magic-link signin
✅ **tickets-no-meals** — Tickets tab does not list meal items
✅ **plan-form-prefills** — plan.html deep-link pre-fills dest + archetype

## Reproduce

```bash
node tests/qa-loop/run.mjs --only=<id>
```
