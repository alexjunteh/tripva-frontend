#!/usr/bin/env bash
# Compare latest/ against baseline/ with ImageMagick.
# Produces a timestamped HTML contact sheet in reports/<stamp>/index.html
# and per-page diff PNGs alongside. Exit 0 if all under threshold, exit 1 otherwise.

set -uo pipefail
HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$HERE"

THRESHOLD_PCT="${THRESHOLD_PCT:-2.0}"   # fail above this % pixel diff
STAMP=$(date +%Y-%m-%d-%H%M)
REPORT_DIR="$HERE/reports/$STAMP"
mkdir -p "$REPORT_DIR/mobile" "$REPORT_DIR/desktop"

if ! command -v compare >/dev/null 2>&1; then
  echo "ERROR: ImageMagick 'compare' not installed. sudo apt install imagemagick" >&2
  exit 2
fi

declare -a ROWS
FAILED=0
TOTAL=0

compare_pair() {
  local vp=$1   # mobile|desktop
  local name=$2
  local base="$HERE/baseline/$vp/$name.png"
  local curr="$HERE/latest/$vp/$name.png"
  local diff="$REPORT_DIR/$vp/$name.diff.png"

  TOTAL=$((TOTAL + 1))

  local status pct curr_rel base_rel diff_rel
  if [ ! -f "$base" ]; then
    status="NEW"
    pct="—"
  elif [ ! -f "$curr" ]; then
    status="MISSING"
    pct="—"
  else
    local ae
    ae=$(compare -metric AE -fuzz 2% "$base" "$curr" "$diff" 2>&1 >/dev/null || true)
    # AE returns integer pixel count; compute %
    local w h total_px
    read -r w h < <(identify -format "%w %h" "$base")
    total_px=$((w * h))
    if [[ "$ae" =~ ^[0-9]+$ ]]; then
      pct=$(awk "BEGIN { printf \"%.2f\", ($ae / $total_px) * 100 }")
      over=$(awk "BEGIN { print ($pct > $THRESHOLD_PCT) ? 1 : 0 }")
      if [ "$over" = "1" ]; then
        status="FAIL"
        FAILED=$((FAILED + 1))
      else
        status="PASS"
      fi
    else
      status="ERROR"
      pct="—"
    fi
  fi

  # Relative paths for HTML
  base_rel="../../baseline/$vp/$name.png"
  curr_rel="../../latest/$vp/$name.png"
  diff_rel="$vp/$name.diff.png"

  ROWS+=("<tr><td>$vp</td><td>$name</td><td class=\"status $status\">$status</td><td>$pct%</td><td><img src=\"$base_rel\" loading=\"lazy\"></td><td><img src=\"$curr_rel\" loading=\"lazy\"></td><td>$([ -f "$diff" ] && echo "<img src=\"$diff_rel\" loading=\"lazy\">" || echo "—")</td></tr>")
}

# Iterate all .png in latest/
for vp in mobile desktop; do
  for f in "$HERE/latest/$vp/"*.png; do
    [ -f "$f" ] || continue
    name=$(basename "$f" .png)
    compare_pair "$vp" "$name"
  done
done

# Build HTML report
cat > "$REPORT_DIR/index.html" <<HTML
<!doctype html>
<html><head>
<meta charset="utf-8">
<title>Tripva visual diff — $STAMP</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;margin:20px;background:#0a0a12;color:#f5f0e8}
  h1{font-size:20px;margin:0 0 6px}
  .meta{color:#888;font-size:13px;margin-bottom:20px}
  table{border-collapse:collapse;width:100%;font-size:13px}
  th,td{border:1px solid #222;padding:6px 8px;text-align:left;vertical-align:top}
  th{background:#15151f;position:sticky;top:0}
  img{max-width:200px;max-height:300px;display:block;border:1px solid #222}
  .status{font-weight:700}
  .status.PASS{color:#4ade80}
  .status.FAIL{color:#f87171}
  .status.NEW{color:#fb923c}
  .status.MISSING{color:#fb923c}
  .status.ERROR{color:#f87171}
</style></head>
<body>
<h1>Tripva visual diff — $STAMP</h1>
<div class="meta">Threshold: ${THRESHOLD_PCT}% pixel diff · $TOTAL pairs · $FAILED failed</div>
<table>
<thead><tr><th>Viewport</th><th>Route</th><th>Status</th><th>Δ</th><th>Baseline</th><th>Latest</th><th>Diff</th></tr></thead>
<tbody>
$(printf '%s\n' "${ROWS[@]}")
</tbody></table>
</body></html>
HTML

echo
echo "=> Report: $REPORT_DIR/index.html"
echo "=> $TOTAL pair(s) compared, $FAILED over ${THRESHOLD_PCT}% threshold"
if [ "$FAILED" -gt 0 ]; then
  exit 1
fi
exit 0
