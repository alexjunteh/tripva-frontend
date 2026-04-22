# Tripva QA loop — 20260422T062306

- Site: https://tripva.app
- Viewport: 390x844
- Passed: 0 / 1
- Failed: 1 (1 critical)

## Results

🔴 **mark-booked-actually-flips** — Clicking Mark Booked reduces pending count + increases booked count (outcome test)
   - JS expr not true — got 'false'
   - JS expr not true — got 'false'
   - Screenshot: `tests/qa-loop/reports/20260422T062306/mark-booked-actually-flips.png`
   - Console: `tests/qa-loop/reports/20260422T062306/mark-booked-actually-flips.console.txt`

## Reproduce

```bash
node tests/qa-loop/run.mjs --only=<id>
```
