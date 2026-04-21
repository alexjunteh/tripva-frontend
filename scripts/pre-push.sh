#!/usr/bin/env bash
# Tripva pre-push gate — runs the visual audit before letting code ship.
# Bypass with: git push --no-verify   (use sparingly — CI will still catch it)
#
# Smart skip: audit is skipped when only docs/*, tests/visual/baseline/*, .github/*,
# or *.md files changed — visual audit has nothing to verify on pure-docs commits.

set -euo pipefail
HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd ../.. && pwd )"
cd "$HERE"

echo "━━━ pre-push: visual audit gate ━━━"

# What's about to be pushed? Compute the diff against remote.
remote="${1:-origin}"
remote_ref=$(git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>/dev/null | sed "s|^$remote/||" || echo "main")
remote_sha=$(git ls-remote "$remote" "$remote_ref" 2>/dev/null | cut -f1 | head -1)
[ -z "$remote_sha" ] && remote_sha=$(git merge-base HEAD "$remote/$remote_ref" 2>/dev/null || echo "HEAD~1")

# Files changed since remote
changed=$(git diff --name-only "$remote_sha" HEAD 2>/dev/null || git diff --name-only HEAD~1 HEAD)

# Skip if only docs / baseline / CI config changed — audit has nothing to verify there.
non_audit=$(echo "$changed" | grep -vE '^(docs/|tests/visual/baseline/|tests/visual/reports/|\.github/|[^/]*\.md$|\.gitignore$)' || true)
if [ -z "$non_audit" ]; then
  echo "→ Only docs/baseline/CI changed — skipping visual audit (safe)."
  echo "    files: $(echo "$changed" | tr '\n' ' ')"
  exit 0
fi

# Audit dependencies — if missing, warn but don't block
if [ ! -x "$HOME/.claude/skills/gstack/browse/dist/browse" ] || ! command -v compare >/dev/null 2>&1; then
  echo "! Audit dependencies missing (browse binary or ImageMagick). Skipping audit."
  echo "    Install ImageMagick: sudo apt install imagemagick"
  echo "    Run manually later: ./tests/visual/audit.sh"
  exit 0
fi

# Run the audit
if [ -x "./tests/visual/audit.sh" ]; then
  if ./tests/visual/audit.sh --quick; then
    echo "✓ Audit passed — proceeding with push."
    exit 0
  else
    echo ""
    echo "✗ VISUAL AUDIT FAILED — push blocked."
    echo "  Review the HTML report above for evidence."
    echo "  Fix the failures and re-commit, or bypass with:"
    echo "    git push --no-verify"
    echo "  (only use --no-verify if you're confident the failure is a false positive"
    echo "   and will fix it in the next commit — CI will catch it either way)"
    exit 1
  fi
else
  echo "! tests/visual/audit.sh not found. Skipping."
  exit 0
fi
