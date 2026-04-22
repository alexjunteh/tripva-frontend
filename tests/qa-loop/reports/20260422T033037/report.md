# Tripva QA loop — 20260422T033037

- Site: https://tripva.app
- Viewport: 390x844
- Passed: 0 / 1
- Failed: 1 (0 critical)

## Results

🟡 **upgrade-to-pro-graceful** — Upgrade to Pro shows graceful 'not ready' toast (no Stripe env yet)
   - JS expr not true — got 'false'
   - Screenshot: `tests/qa-loop/reports/20260422T033037/upgrade-to-pro-graceful.png`
   - Console: `tests/qa-loop/reports/20260422T033037/upgrade-to-pro-graceful.console.txt`

## Reproduce

```bash
node tests/qa-loop/run.mjs --only=<id>
```
