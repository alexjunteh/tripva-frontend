#!/usr/bin/env bash
# One-shot installer for Tripva's git hooks.
# Run once after cloning the repo to enable the visual-audit pre-push gate.
#
#   ./scripts/install-hooks.sh

set -euo pipefail
HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )"
cd "$HERE"

if [ ! -d .git/hooks ]; then
  echo "ERROR: .git/hooks not found — is this a git repo?" >&2
  exit 1
fi

for hook in pre-push; do
  src="$HERE/scripts/$hook.sh"
  dst="$HERE/.git/hooks/$hook"
  if [ ! -f "$src" ]; then continue; fi
  if [ -f "$dst" ] && ! cmp -s "$src" "$dst"; then
    echo "! $dst exists and differs from $src — backing up to $dst.bak"
    mv "$dst" "$dst.bak"
  fi
  cp "$src" "$dst"
  chmod +x "$dst"
  echo "✓ installed $hook"
done

echo ""
echo "Hooks installed. They'll run before every \`git push\`."
echo "Bypass once with: git push --no-verify"
