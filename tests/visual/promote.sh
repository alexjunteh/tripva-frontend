#!/usr/bin/env bash
# Promote latest/ to baseline/. Run after intentional redesign passes.
set -euo pipefail
HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$HERE"

if [ ! -d latest/mobile ] || [ ! -d latest/desktop ]; then
  echo "ERROR: latest/ does not exist — run capture.sh first" >&2
  exit 1
fi

rsync -a --delete latest/mobile/ baseline/mobile/
rsync -a --delete latest/desktop/ baseline/desktop/
echo "=> Promoted latest/ → baseline/"
ls baseline/mobile baseline/desktop | head -20
