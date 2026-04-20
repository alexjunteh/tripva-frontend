#!/usr/bin/env bash
# Capture mobile + desktop screenshots for every route in routes.conf.
# Output: tests/visual/latest/{mobile,desktop}/<name>.png

set -euo pipefail
HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$HERE"

export PATH="$HOME/.bun/bin:$PATH"
# Hardcode gstack browse path — /usr/bin/browse is an xdg-open symlink on Linux.
B="${BROWSE_BIN:-$HOME/.claude/skills/gstack/browse/dist/browse}"
if [ ! -x "$B" ]; then
  echo "ERROR: gstack browse binary not found at $B" >&2
  echo "       Override with BROWSE_BIN=/path/to/browse" >&2
  exit 1
fi

MOBILE_VP="390x844"
DESKTOP_VP="1280x800"

OUT_MOBILE="$HERE/latest/mobile"
OUT_DESKTOP="$HERE/latest/desktop"
mkdir -p "$OUT_MOBILE" "$OUT_DESKTOP"

# Clean previous latest
rm -f "$OUT_MOBILE"/*.png "$OUT_DESKTOP"/*.png

ROUTES_FILE="$HERE/routes.conf"
if [ ! -f "$ROUTES_FILE" ]; then
  echo "ERROR: routes.conf not found" >&2
  exit 1
fi

capture_one() {
  local vp=$1 outdir=$2 name=$3 url=$4 wait_ms=$5
  "$B" viewport "$vp" >/dev/null 2>&1
  "$B" goto "$url" >/dev/null 2>&1
  # wait for page settle
  local secs
  secs=$(awk "BEGIN { print ($wait_ms / 1000) }")
  sleep "$secs"
  "$B" screenshot "$outdir/$name.png" >/dev/null 2>&1
  echo "  [$vp] $name"
}

echo "=> Capturing baseline for $(wc -l < <(grep -vE '^\s*(#|$)' "$ROUTES_FILE")) route(s) × 2 viewports"
while IFS='|' read -r name url wait_ms; do
  # strip whitespace
  name=$(echo "$name" | xargs)
  url=$(echo "$url" | xargs)
  wait_ms=$(echo "$wait_ms" | xargs)
  # skip comments/empty
  case "$name" in ''|'#'*) continue ;; esac
  [ -z "$url" ] && continue
  [ -z "$wait_ms" ] && wait_ms=1500

  capture_one "$MOBILE_VP"  "$OUT_MOBILE"  "$name" "$url" "$wait_ms"
  capture_one "$DESKTOP_VP" "$OUT_DESKTOP" "$name" "$url" "$wait_ms"
done < "$ROUTES_FILE"

echo
echo "=> Saved to tests/visual/latest/{mobile,desktop}/"
ls "$OUT_MOBILE" "$OUT_DESKTOP" 2>/dev/null | head -20
