# Visual regression harness

Mobile + desktop screenshot comparison for the Tripva frontend.

## Quick start

```bash
cd tests/visual

# 1. Capture current state of the live site
./capture.sh

# 2. First run: promote as baseline
./promote.sh

# 3. After making changes, recapture + compare
./capture.sh
./compare.sh   # exits 1 if any route over threshold

# 4. Open the HTML contact sheet
xdg-open reports/<latest-stamp>/index.html   # or cat the path
```

## What each script does

- **`capture.sh`** — iterates `routes.conf`, navigates `browse` to each URL at `390x844` (mobile) and `1280x800` (desktop), writes PNGs to `latest/{mobile,desktop}/<name>.png`.
- **`compare.sh`** — pixel-diffs `latest/*` against `baseline/*` using ImageMagick's `compare -metric AE -fuzz 2%`. Generates a side-by-side HTML contact sheet in `reports/<stamp>/index.html`. Fails if any route is over `THRESHOLD_PCT` (default 2.0%).
- **`promote.sh`** — moves `latest/` to `baseline/`. Use after an intentional design change is verified-good.

## Configuration

- **Routes** — edit `routes.conf`. Format: `name | url | wait_ms`. Comments start with `#`.
- **Threshold** — override via `THRESHOLD_PCT=5.0 ./compare.sh`.
- **Viewports** — edit `MOBILE_VP` / `DESKTOP_VP` constants in `capture.sh`.

## Dependencies

- `browse` (gstack) — for headless screenshot capture. Needs `bun` in `$PATH`.
- `imagemagick` (`compare`, `identify`) — for pixel diff and image metadata.
- `rsync` — for baseline promotion.

All three are present on the current machine.

## Why pixel-diff + human contact sheet

Pure pixel-identical tests are fragile (fonts, timing, animation, LLM-generated content in trip data). We instead:

1. Use `-fuzz 2%` to ignore sub-visible color noise.
2. Set a 2% area threshold — smaller than any meaningful visual change.
3. Always produce a **side-by-side contact sheet** so a human can eyeball baseline vs latest vs diff.

A CI job can `./compare.sh` as a hard gate (exit code). A human reviewer clicks the HTML for the nuanced read.

## Directory layout

```
tests/visual/
  routes.conf           # route list
  capture.sh            # capture entry point
  compare.sh            # pixel-diff + HTML report
  promote.sh            # latest → baseline
  baseline/
    mobile/*.png        # trusted reference shots
    desktop/*.png
  latest/
    mobile/*.png        # last capture
    desktop/*.png
  reports/
    YYYY-MM-DD-HHMM/
      index.html        # contact sheet for that run
      mobile/*.diff.png
      desktop/*.diff.png
```

`latest/` and `reports/` are gitignored. `baseline/` is committed.
