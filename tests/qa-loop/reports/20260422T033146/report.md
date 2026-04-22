# Tripva QA loop — 20260422T033146

- Site: https://tripva.app
- Viewport: 390x844
- Passed: 1 / 1
- Failed: 0 (0 critical)

## Results

✅ **upgrade-to-pro-graceful** — Upgrade to Pro shows graceful 'not ready' toast (no Stripe env yet)

## Reproduce

```bash
node tests/qa-loop/run.mjs --only=<id>
```
