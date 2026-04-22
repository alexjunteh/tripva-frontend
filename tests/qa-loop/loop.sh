#!/usr/bin/env bash
# tests/qa-loop/loop.sh — The "human QA → fix → retest" loop wrapper.
#
# One iteration:
#   1. Run scripted journeys (journeys.json) — smoke pass
#   2. Run exhaustive clicker (explore.mjs) — every button on every page
#   3. If both clean → exit 0 (ship-ready)
#   4. If failures → show report paths + exit non-zero so a fix agent
#      (Claude Code session or human) can read, fix, commit, re-invoke
#
# After a fix commit pushes to prod, run this again. Iterate until 0.
#
# Usage:
#   ./tests/qa-loop/loop.sh                 # one iteration
#   ./tests/qa-loop/loop.sh --journeys-only # skip exhaustive explore
#   ./tests/qa-loop/loop.sh --explore-only  # only exhaustive
#   ./tests/qa-loop/loop.sh --site=https://staging.tripva.app

set -uo pipefail
HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$HERE/../.."

export PATH="$HOME/.bun/bin:$PATH"
MODE="both"
for arg in "$@"; do
  case "$arg" in
    --journeys-only) MODE="journeys" ;;
    --explore-only)  MODE="explore" ;;
    --site=*)        export QA_SITE="${arg#--site=}" ;;
  esac
done

R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; C='\033[0;36m'; N='\033[0m'
echo -e "${C}━━━ QA Loop ━━━${N}"
echo "  Site:     ${QA_SITE:-https://tripva.app}"
echo "  Mode:     $MODE"

EXIT_A=0
EXIT_J=0
EXIT_E=0

if [ "$MODE" = "both" ] || [ "$MODE" = "journeys" ] || [ "$MODE" = "api" ]; then
  echo -e "\n${C}[1/3] Backend API smoke${N}"
  bash tests/qa-loop/api-smoke.sh
  EXIT_A=$?
fi

if [ "$MODE" = "both" ] || [ "$MODE" = "journeys" ]; then
  echo -e "\n${C}[2/3] Scripted frontend journeys${N}"
  node tests/qa-loop/run.mjs
  EXIT_J=$?
fi

if [ "$MODE" = "both" ] || [ "$MODE" = "explore" ]; then
  echo -e "\n${C}[3/3] Exhaustive element crawler${N}"
  node tests/qa-loop/explore.mjs
  EXIT_E=$?
fi

TOTAL=$((EXIT_A + EXIT_J + EXIT_E))
echo ""
if [ "$TOTAL" = "0" ]; then
  echo -e "${G}✓ QA loop PASSED${N} — ship-ready"
  exit 0
fi

echo -e "${R}✗ QA loop FAILED${N} — $TOTAL critical failure(s)"
echo -e "${Y}Next: read the latest report in tests/qa-loop/reports/, apply fixes, re-run${N}"
echo -e "${Y}Once clean: deploy and invoke again. Repeat until 0.${N}"
LATEST=$(ls -1td tests/qa-loop/reports/*/ 2>/dev/null | head -5)
if [ -n "$LATEST" ]; then
  echo ""
  echo "Recent reports:"
  for r in $LATEST; do echo "  $r"; done
fi
exit $TOTAL
