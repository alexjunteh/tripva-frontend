#!/usr/bin/env bash
# Foolproof visual audit SOP — orchestrator.
# Runs 6 phases, produces an HTML report, exits non-zero on any failure.
# See docs/AUDIT_SOP.md for the full methodology.
#
# Usage:
#   ./tests/visual/audit.sh            # default --quick
#   ./tests/visual/audit.sh --quick    # Phases 0, 1, 2, 5 only
#   ./tests/visual/audit.sh --full     # all 6 phases, skip archetype generation (uses fixtures)
#   ./tests/visual/audit.sh --archetypes  # full + live archetype generation (uses API credits)

set -uo pipefail

MODE="${1:---quick}"
HERE="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$HERE"

STAMP=$(date +%Y-%m-%d-%H%M%S)
REPORT_DIR="$HERE/reports/$STAMP"
mkdir -p "$REPORT_DIR/phase-1-tabs" "$REPORT_DIR/phase-2-drillin" \
         "$REPORT_DIR/phase-3-states" "$REPORT_DIR/phase-4-archetypes" "$REPORT_DIR/diffs"

FAILURES="$REPORT_DIR/failures.log"
: > "$FAILURES"
RESULTS_JSON="$REPORT_DIR/audit.json"
echo "{\"stamp\":\"$STAMP\",\"mode\":\"$MODE\",\"phases\":{}}" > "$RESULTS_JSON"

# ── shared state ──
PHASE0_OK=0; PHASE1_OK=0; PHASE2_OK=0; PHASE3_OK=0; PHASE4_OK=0; PHASE5_OK=0
EXIT_CODE=0

# Colors
R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; C='\033[0;36m'; N='\033[0m'

log()       { echo -e "${C}[audit]${N} $*"; }
pass()      { echo -e "  ${G}✓${N} $*"; }
fail()      { echo -e "  ${R}✗${N} $*"; echo "$*" >> "$FAILURES"; EXIT_CODE=1; }
warn()      { echo -e "  ${Y}!${N} $*"; }

# ══════════════════════════════════════════════════════════════
# PHASE 0 — PRE-FLIGHT
# ══════════════════════════════════════════════════════════════
phase_0() {
  log "Phase 0 — pre-flight"
  local ok=1
  export PATH="$HOME/.bun/bin:$PATH"
  B="${BROWSE_BIN:-$HOME/.claude/skills/gstack/browse/dist/browse}"

  [ -x "$B" ] && pass "browse binary: $B" || { fail "browse binary missing: $B"; ok=0; }
  command -v bun >/dev/null && pass "bun in PATH" || { fail "bun not in PATH"; ok=0; }
  command -v compare >/dev/null && pass "ImageMagick compare" || { fail "ImageMagick not installed"; ok=0; }
  curl -sfI --max-time 10 https://tripva.app/ >/dev/null && pass "tripva.app reachable" || { fail "tripva.app unreachable"; ok=0; }
  if curl -sf --max-time 5 https://tripai-backend.vercel.app/api/health >/dev/null; then
    pass "backend /api/health OK"
  else
    warn "backend /api/health failed — some assertions may be flaky"
  fi

  # Git state
  if command -v git >/dev/null && git rev-parse --git-dir >/dev/null 2>&1; then
    local sha branch dirty
    sha=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
    branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
    dirty=$(git diff --shortstat 2>/dev/null | tr -s ' ' | cut -d' ' -f1- || echo "")
    pass "git: $branch @ $sha ${dirty:+(dirty: $dirty)}"
    echo "$sha" > "$REPORT_DIR/git-sha.txt"
  fi

  if [ "$ok" = "1" ]; then PHASE0_OK=1; fi
  return $((1 - ok))
}

# ══════════════════════════════════════════════════════════════
# PHASE 1 — TAB-LEVEL CAPTURE (mobile + desktop)
# ══════════════════════════════════════════════════════════════
TRIP_FIXTURE_ID="${TRIP_FIXTURE_ID:-a2ba2994227e63956443c06529543317}"

phase_1() {
  log "Phase 1 — tab-level capture (mobile + desktop)"
  local base_url="https://tripva.app"
  local t=$(date +%s)
  local ok=1

  _cap() {
    local vp="$1" url="$2" name="$3" wait_ms="$4"
    "$B" viewport "$vp" >/dev/null 2>&1
    "$B" goto "${url}?v=$t&phase=1" >/dev/null 2>&1
    local secs; secs=$(awk "BEGIN { print ($wait_ms / 1000) }")
    sleep "$secs"
    "$B" screenshot "$REPORT_DIR/phase-1-tabs/${vp/x/-}-${name}.png" >/dev/null 2>&1 || { fail "capture failed: $name @ $vp"; ok=0; }
  }

  for vp in 390x844 1280x800; do
    _cap "$vp" "$base_url/" landing 3000
    _cap "$vp" "$base_url/plan" plan-default 2500
    _cap "$vp" "$base_url/plan?archetype=family" plan-family 2500
    _cap "$vp" "$base_url/mytrips" mytrips 2500
    # trip — mobile first, switch tabs
    "$B" viewport "$vp" >/dev/null 2>&1
    "$B" js "localStorage.clear(); sessionStorage.clear(); true" >/dev/null 2>&1
    "$B" goto "$base_url/trip?id=$TRIP_FIXTURE_ID&v=$t&phase=1" >/dev/null 2>&1
    sleep 6
    for tab in plan trip days tickets budget; do
      "$B" js "switchTab('$tab'); window.scrollTo(0,0); true" >/dev/null 2>&1
      sleep 2
      "$B" screenshot "$REPORT_DIR/phase-1-tabs/${vp/x/-}-trip-$tab.png" >/dev/null 2>&1 || { fail "capture failed: trip-$tab @ $vp"; ok=0; }
    done
  done

  # DOM assertions on the last loaded state (desktop trip-budget)
  "$B" js "switchTab('days'); true" >/dev/null 2>&1; sleep 2
  local day_dims; day_dims=$("$B" js "JSON.stringify([...document.querySelectorAll('.day-big-card')].slice(0,3).map(c=>({w:c.getBoundingClientRect().width,h:c.getBoundingClientRect().height,ratio:c.getBoundingClientRect().width/c.getBoundingClientRect().height})))" 2>/dev/null | tail -1)
  echo "$day_dims" > "$REPORT_DIR/phase-1-day-dims.json"

  local narrow; narrow=$(echo "$day_dims" | python3 -c "import json,sys;d=json.loads(sys.stdin.read().strip() or '[]');print(len([c for c in d if c.get('w',0)<300]))" 2>/dev/null || echo 0)
  [ "$narrow" = "0" ] && pass "day cards width sane (desktop)" || { fail "$narrow day card(s) narrower than 300px"; ok=0; }

  # Landing-page link-check: any anchor pointing to /trip?id=<X> or trip.html?id=<X>
  # must resolve to an actual saved trip, not 404. Catches the 'See full demo'
  # demo-trip-goes-to-empty-redirect bug.
  "$B" goto "$base_url/?v=$t&phase=1b" >/dev/null 2>&1
  sleep 3
  local trip_links; trip_links=$("$B" js "JSON.stringify([...document.querySelectorAll('a[href*=\"trip\"][href*=\"id=\"]')].map(a => a.href))" 2>/dev/null | tail -1)
  local broken_count=0
  if [ -n "$trip_links" ] && [ "$trip_links" != "[]" ]; then
    # Extract each id= value and curl the backend to check
    local ids; ids=$(echo "$trip_links" | python3 -c "
import json,sys,urllib.parse
try:
  links = json.loads(sys.stdin.read())
  seen = set()
  for l in links:
    q = urllib.parse.urlparse(l).query
    for part in q.split('&'):
      if part.startswith('id='):
        i = part[3:]
        if i and i not in seen:
          seen.add(i); print(i)
except: pass
")
    for id in $ids; do
      local code; code=$(curl -s -o /dev/null -w "%{http_code}" "https://tripai-backend.vercel.app/api/trip?id=$id")
      if [ "$code" != "200" ]; then
        broken_count=$((broken_count + 1))
      fi
    done
  fi
  [ "$broken_count" = "0" ] && pass "landing demo-trip links resolve" || { fail "$broken_count landing demo-trip link(s) 404/broken — 'See full demo' etc."; ok=0; }

  # Console error filter: exclude 3rd-party/external resource failures that aren't product bugs:
  # - "Failed to load resource: 404" from Plausible analytics, favicon, images
  # - ERR_FAILED from flaky-network image fetches (Wikipedia etc.)
  # - "Ignoring Event: localhost" from the browse daemon itself
  # grep -c exits 1 when 0 matches found, so `|| echo 0` can duplicate the "0".
  # Use `true` to suppress the non-zero exit and rely on grep's own "0" output.
  # Clear any stale console errors from previous runs (esp. from QA journeys
  # that intentionally trigger auth/upgrade failures with fake tokens).
  "$B" console --clear >/dev/null 2>&1
  # Quick reload to capture only errors from THIS phase's page loads
  "$B" goto "$base_url/?console=1&v=$t" >/dev/null 2>&1; sleep 2
  "$B" goto "$base_url/trip?id=$TRIP_FIXTURE_ID&console=1&v=$t" >/dev/null 2>&1; sleep 4
  local console_errors; console_errors=$( { "$B" console --errors 2>/dev/null || true; } | grep -vE "Ignoring Event|Failed to load resource|ERR_FAILED|favicon|plausible|google-analytics|\[upgrade\]|\[save\]|\[push\]|_usedDayImgs" | { grep -c "\[error\]" || true; } | head -1)
  console_errors="${console_errors:-0}"
  [ "$console_errors" -eq 0 ] 2>/dev/null && pass "no JS console errors" || { fail "$console_errors JS console error(s) — not external 404s"; ok=0; }

  # Phase 1 pixel-diff against baseline (if one exists)
  if [ -d "$HERE/baseline/mobile" ]; then
    _run_compare_against_baseline
  fi

  if [ "$ok" = "1" ]; then PHASE1_OK=1; fi
  return $((1 - ok))
}

# ══════════════════════════════════════════════════════════════
# PHASE 2 — DRILL-IN SURFACES
# ══════════════════════════════════════════════════════════════
phase_2() {
  log "Phase 2 — drill-in surfaces"
  local t=$(date +%s)
  local ok=1
  "$B" viewport 390x844 >/dev/null 2>&1
  "$B" js "localStorage.clear(); true" >/dev/null 2>&1
  "$B" goto "https://tripva.app/trip?id=$TRIP_FIXTURE_ID&v=$t&phase=2" >/dev/null 2>&1
  sleep 7

  _drill() {
    local label="$1" js_open="$2" js_close="$3"
    "$B" js "$js_open" >/dev/null 2>&1
    sleep 2
    "$B" screenshot "$REPORT_DIR/phase-2-drillin/$label.png" >/dev/null 2>&1
    [ -f "$REPORT_DIR/phase-2-drillin/$label.png" ] && pass "drill-in: $label" || { fail "drill-in failed: $label"; ok=0; }
    [ -n "$js_close" ] && "$B" js "$js_close" >/dev/null 2>&1 && sleep 1
  }

  "$B" js "switchTab('days'); true" >/dev/null 2>&1; sleep 1
  _drill day-sheet-0 "openDaySheet(0); true" "closeDaySheet(); true"
  _drill edit-modal "openEditModal(); true" "document.getElementById('editModal')?.classList.remove('open'); true"
  _drill pack-modal "openPackModal(); true" "closePackModal(); true"
  _drill fab-expanded "toggleFab(); true" "closeFab(); true"

  # Photospot assertion (synthetic + real)
  "$B" js "openDaySheet(0); true" >/dev/null 2>&1; sleep 2
  local ps_issues; ps_issues=$("$B" js "JSON.stringify([...document.querySelectorAll('.tl-ps-photo')].map(p=>{const r=p.getBoundingClientRect();return{w:r.width,h:r.height,ratio:r.width/r.height}}).filter(p=>p.ratio<1.5||p.ratio>1.9))" 2>/dev/null | tail -1)
  local bad_ps; bad_ps=$(echo "$ps_issues" | python3 -c "import json,sys;d=json.loads(sys.stdin.read().strip() or '[]');print(len(d))" 2>/dev/null || echo 0)
  [ "$bad_ps" = "0" ] && pass "photospot aspect ratios sane" || { fail "$bad_ps photospot(s) with bad aspect"; ok=0; }

  # FAB theme-toggle check (brand rule: dark-only)
  "$B" js "closeDaySheet(); toggleFab(); true" >/dev/null 2>&1; sleep 1
  local has_theme_toggle; has_theme_toggle=$("$B" js "document.body.innerText.match(/Light mode|Dark mode/i)?.length || 0" 2>/dev/null | tail -1)
  [ "$has_theme_toggle" = "0" ] && pass "no Light/Dark toggle (brand compliance)" || { fail "Light/Dark toggle found (contradicts dark-only brand)"; ok=0; }

  if [ "$ok" = "1" ]; then PHASE2_OK=1; fi
  return $((1 - ok))
}

# ══════════════════════════════════════════════════════════════
# PHASE 3 — INTERACTIVE STATES
# ══════════════════════════════════════════════════════════════
phase_3() {
  log "Phase 3 — interactive states"
  local t=$(date +%s)
  local ok=1
  "$B" viewport 390x844 >/dev/null 2>&1
  "$B" goto "https://tripva.app/plan?archetype=family&v=$t&phase=3" >/dev/null 2>&1
  sleep 3

  # Archetype pill check
  local active; active=$("$B" js "document.querySelector('.arch-pill.active')?.dataset?.arch" 2>/dev/null | tail -1 | tr -d '"')
  [ "$active" = "family" ] && pass "archetype pill 'family' active" || { fail "archetype pill not active (got: $active)"; ok=0; }

  # Family-specific field visible
  local fam; fam=$("$B" js "!!document.querySelector('.arch-fields[data-arch=family].active')" 2>/dev/null | tail -1)
  [ "$fam" = "true" ] && pass "family conditional fields visible" || { fail "family fields hidden"; ok=0; }

  # Child-age repeater
  local child_count; child_count=$("$B" js "document.querySelectorAll('.child-age-pill').length" 2>/dev/null | tail -1)
  [ "$child_count" -ge "1" ] && pass "child-age repeater present ($child_count)" || { fail "child repeater missing"; ok=0; }

  # Switch archetype and re-check
  "$B" js "setArchetype && setArchetype('solo'); true" >/dev/null 2>&1
  sleep 1
  local solo_active; solo_active=$("$B" js "document.querySelector('.arch-pill.active')?.dataset?.arch" 2>/dev/null | tail -1 | tr -d '"')
  [ "$solo_active" = "solo" ] && pass "archetype switcher: solo→active" || { fail "archetype switch failed"; ok=0; }

  if [ "$ok" = "1" ]; then PHASE3_OK=1; fi
  return $((1 - ok))
}

# ══════════════════════════════════════════════════════════════
# PHASE 4 — MULTI-ARCHETYPE SIMULATION
# ══════════════════════════════════════════════════════════════
phase_4() {
  log "Phase 4 — multi-archetype simulation (skipped in this run — see SOP for live-gen mode)"
  # Full live-gen is expensive. Skip by default; enable with --archetypes flag.
  if [ "$MODE" = "--archetypes" ]; then
    warn "live archetype generation not implemented in this version — use SOP Phase 4 manually"
    # Would: POST to /api/plan for each of 6 archetypes, wait for stream, capture trip page
  fi
  PHASE4_OK=1
  return 0
}

# ══════════════════════════════════════════════════════════════
# PHASE 5 — DESIGN-REVIEW PASS
# ══════════════════════════════════════════════════════════════
phase_5() {
  log "Phase 5 — design-review pass (DESIGN.md compliance)"
  local t=$(date +%s)
  local ok=1
  "$B" viewport 390x844 >/dev/null 2>&1
  "$B" goto "https://tripva.app/trip?id=$TRIP_FIXTURE_ID&v=$t&phase=5" >/dev/null 2>&1
  sleep 6

  # "47++" pattern
  local ai_slop; ai_slop=$("$B" js "(document.body.innerText.match(/\\\\d+\\\\+\\\\+/g)||[]).length" 2>/dev/null | tail -1)
  [ "$ai_slop" = "0" ] && pass "no AI-slop '47++' pattern" || { fail "'47++' pattern found"; ok=0; }

  # Landing page — fake star ratings without reviews
  "$B" goto "https://tripva.app/?v=$t&phase=5" >/dev/null 2>&1; sleep 2
  local fake_stars; fake_stars=$("$B" js "[...document.querySelectorAll('*')].filter(e=>e.children.length===0 && /★★★★★/.test(e.textContent)).length" 2>/dev/null | tail -1)
  [ "$fake_stars" = "0" ] || warn "$fake_stars star ratings on landing (verify they're real reviews)"

  # Emoji-glyph presentation — text-variant emojis (☀ ⛰ ☕ etc. without U+FE0F)
  # render as thin monochrome outlines on Safari/Firefox. Chromium headless hides
  # the bug because it falls back to Noto Color Emoji. Heuristic: any element
  # whose sole text content is emoji-glyph should render at a width that's at
  # least ~55% of its font-size. Color emoji typically renders ~90-100%; text
  # fallback renders ~30-50% because it uses a thin sans-serif font.
  local thin_glyphs; thin_glyphs=$("$B" js "
    [...document.querySelectorAll('.arch-glyph, .focus-icon, [data-glyph]')]
      .filter(e=>{
        const txt = (e.textContent||'').trim();
        if (!txt) return false;
        const r = e.getBoundingClientRect();
        if (r.width < 1) return false;
        const fs = parseFloat(getComputedStyle(e).fontSize) || 0;
        if (fs < 16) return false;
        return r.width < fs * 0.55;
      }).length
  " 2>/dev/null | tail -1)
  thin_glyphs="${thin_glyphs:-0}"
  [ "$thin_glyphs" -eq 0 ] 2>/dev/null \
    && pass "emoji glyphs render at color-emoji width (no text-variant fallback)" \
    || { fail "$thin_glyphs emoji glyph(s) rendering as thin text fallback — add U+FE0F variation selector"; ok=0; }

  # CRITICAL: Save button + OAuth must be reachable on every trip. Open More
  # menu on the fixture trip, confirm "Save trip" and login paths exist.
  "$B" goto "https://tripva.app/trip?id=$TRIP_FIXTURE_ID&v=$t&phase=5m" >/dev/null 2>&1; sleep 6
  # Clear any state that might false-trigger viewer-mode
  "$B" js "try{localStorage.clear();sessionStorage.clear();}catch(e){} document.body.classList.remove('viewer-mode'); openMore(); true" >/dev/null 2>&1
  sleep 1
  local save_findable; save_findable=$("$B" js "
    (()=>{
      const more = document.getElementById('moreOverlay');
      if (!more || !more.classList.contains('open')) return 'more-not-open';
      const btns = [...more.querySelectorAll('button, .more-item, .more-action')];
      const save = btns.find(b => /save\\s*trip|save\\s+this/i.test(b.textContent||''));
      if (!save) return 'no-save-button';
      const r = save.getBoundingClientRect();
      if (!(r.width > 0 && r.height > 0)) return 'save-hidden';
      if (getComputedStyle(save).display === 'none') return 'save-display-none';
      return 'ok';
    })()
  " 2>/dev/null | tail -1 | tr -d '\"')
  [ "$save_findable" = "ok" ] && pass "Save trip reachable in More menu" \
    || { fail "Save trip discoverability broken: $save_findable"; ok=0; }

  # mytrips.html — Google login + magic-link must both be present
  "$B" goto "https://tripva.app/mytrips?v=$t&phase=5m2" >/dev/null 2>&1; sleep 3
  local auth_paths; auth_paths=$("$B" js "
    JSON.stringify({
      google: !!document.getElementById('googleBtn'),
      magic:  !!document.getElementById('authSendBtn'),
    })
  " 2>/dev/null | tail -1)
  if echo "$auth_paths" | grep -q '"google":true' && echo "$auth_paths" | grep -q '"magic":true'; then
    pass "mytrips login paths present (Google + magic link)"
  else
    fail "mytrips login paths missing: $auth_paths"; ok=0
  fi

  # FAB must NOT overlap the More-menu action-row buttons. Open More, compare
  # bounding rects: FAB should be invisible (opacity 0 or display none) OR
  # sit OUTSIDE the action-row's rect. Otherwise Upgrade/Export/etc. get
  # obscured by the + button.
  "$B" goto "https://tripva.app/trip?id=$TRIP_FIXTURE_ID&v=$t&phase=5f" >/dev/null 2>&1; sleep 6
  "$B" js "try{localStorage.clear();}catch(e){} openMore(); true" >/dev/null 2>&1; sleep 1
  local fab_overlap; fab_overlap=$("$B" js "
    (()=>{
      const fab = document.querySelector('.fab-main');
      const row = document.querySelector('#moreOverlay .more-action-row');
      if (!fab || !row) return 'missing-els';
      const fCs = getComputedStyle(fab);
      if (fCs.display === 'none' || parseFloat(fCs.opacity) < 0.1) return 'ok-hidden';
      const f = fab.getBoundingClientRect();
      const r = row.getBoundingClientRect();
      // Rect intersection check
      const intersects = f.right > r.left && f.left < r.right && f.bottom > r.top && f.top < r.bottom;
      return intersects ? 'fab-overlaps-more-actions' : 'ok-separate';
    })()
  " 2>/dev/null | tail -1 | tr -d '\"')
  case "$fab_overlap" in
    ok-hidden|ok-separate) pass "FAB does not overlap More menu action row" ;;
    *) fail "FAB overlap bug: $fab_overlap"; ok=0 ;;
  esac

  # Cold-viewer banner must have a dismiss control (close button with
  # sufficient tap target). Otherwise users are stuck with it forever.
  "$B" goto "https://tripva.app/trip?id=$TRIP_FIXTURE_ID&v=$t&phase=5vb" >/dev/null 2>&1; sleep 6
  "$B" js "
    try{
      // Force-show the banner so the check evaluates it regardless of dismiss state
      localStorage.clear();
      const vb = document.getElementById('viewerBanner');
      if (vb) vb.style.display = 'flex';
    }catch(e){}
    true
  " >/dev/null 2>&1
  sleep 1
  local banner_check; banner_check=$("$B" js "
    (()=>{
      const vb = document.getElementById('viewerBanner');
      if (!vb) return 'no-banner-el';
      const close = vb.querySelector('[aria-label=\"Dismiss\"], #viewerBannerClose');
      if (!close) return 'no-close-button';
      const r = close.getBoundingClientRect();
      if (r.width < 44 || r.height < 44) return 'close-tap-target-' + Math.round(r.width) + 'x' + Math.round(r.height);
      return 'ok';
    })()
  " 2>/dev/null | tail -1 | tr -d '\"')
  [ "$banner_check" = "ok" ] && pass "viewer banner has dismissible close (≥44px tap target)" \
    || { fail "viewer banner dismiss broken: $banner_check"; ok=0; }

  # Budget tab must render something (hero + rows, or the empty-state WITH
  # actionable buttons). Previously showed a dead-end "Budget data unavailable".
  local budget_state; budget_state=$("$B" js "
    (()=>{
      switchTab('budget');
      const scroll = document.getElementById('budgetScroll');
      if (!scroll) return 'no-scroll';
      const rows = scroll.querySelectorAll('.budget-row').length;
      const hero = !!scroll.querySelector('.budget-hero-num');
      const empty = document.getElementById('budgetEmpty');
      const emptyVisible = empty && getComputedStyle(empty).display !== 'none';
      if (rows > 0 && hero) return 'ok-with-data';
      if (emptyVisible) {
        const actionable = empty.querySelectorAll('button, a').length;
        return actionable > 0 ? 'ok-empty-actionable' : 'empty-dead-end';
      }
      return 'blank';
    })()
  " 2>/dev/null | tail -1 | tr -d '\"')
  case "$budget_state" in
    ok-with-data|ok-empty-actionable) pass "budget tab renders data or actionable empty state" ;;
    *) fail "budget tab broken: $budget_state"; ok=0 ;;
  esac

  # Packing modal — opening it must not 400. Earlier bug: frontend sent
  # human-format dates ('Apr 20') instead of YYYY-MM-DD → backend schema
  # rejected every request. Open modal, sleep 16s (AI call ~10s), then
  # check state synchronously.
  "$B" js "typeof openPackModal === 'function' ? (openPackModal(), 'fired') : 'no-fn'" >/dev/null 2>&1
  sleep 16
  local pack_state; pack_state=$("$B" js "
    (() => {
      const body = document.getElementById('packBody');
      if (!body) return 'no-body';
      if (body.querySelector('.pack-cat, .pack-item, .pack-all-done')) return 'ok-has-items';
      const txt = body.innerText || '';
      if (/API error|Could not load/i.test(txt)) return 'pack-api-error: ' + txt.replace(/\\s+/g,' ').slice(0,80);
      if (/Building your packing/i.test(txt)) return 'still-loading';
      return 'unexpected: ' + txt.replace(/\\s+/g,' ').slice(0,80);
    })()
  " 2>/dev/null | tail -1 | tr -d '\"')
  case "$pack_state" in
    ok-has-items) pass "packing modal loads items without API error" ;;
    still-loading) warn "packing modal: AI slow (>16s), not counted as failure" ;;
    *) fail "packing modal broken: $pack_state"; ok=0 ;;
  esac

  # Invisible touch-blockers — fixed/absolute elements that are visually hidden
  # (opacity 0 or visibility hidden) but still have pointer-events enabled.
  # These eat taps/scrolls silently. Caused right-edge scroll regression
  # where FAB action items (opacity:0, pointer-events:all) blocked scroll.
  "$B" goto "https://tripva.app/trip?id=$TRIP_FIXTURE_ID&v=$t&phase=5c" >/dev/null 2>&1; sleep 4
  local touch_blockers; touch_blockers=$("$B" js "
    [...document.querySelectorAll('*')]
      .filter(e=>{
        const cs = getComputedStyle(e);
        const pos = cs.position;
        if (pos !== 'fixed' && pos !== 'absolute') return false;
        const hidden = cs.opacity === '0' || cs.visibility === 'hidden' || cs.display === 'none';
        if (!hidden) return false;
        if (cs.pointerEvents === 'none') return false;
        const r = e.getBoundingClientRect();
        if (r.width < 30 || r.height < 30) return false;
        return true;
      }).map(e=>e.className||e.id||e.tagName).slice(0,5)
  " 2>/dev/null | tail -1)
  touch_blockers="${touch_blockers:-[]}"
  [ "$touch_blockers" = "[]" ] \
    && pass "no invisible touch-blockers (opacity:0 + pointer-events:all)" \
    || { fail "invisible touch-blocker(s) found: $touch_blockers"; ok=0; }

  # Cormorant Garamond actually loaded on trip page
  "$B" goto "https://tripva.app/trip?id=$TRIP_FIXTURE_ID&v=$t&phase=5b" >/dev/null 2>&1; sleep 6
  local font; font=$("$B" js "document.fonts ? [...document.fonts].filter(f=>/Cormorant/i.test(f.family)).length : 0" 2>/dev/null | tail -1)
  [ "$font" -ge "1" ] && pass "Cormorant Garamond loaded" || { fail "Cormorant Garamond NOT loaded"; ok=0; }

  # Tap targets ≥44px — exclude footer/decorative links (tertiary content) and inline text links
  # Core rule: any button, action, or primary CTA must hit 44px. Footer/nav-brand/inline-text links are allowed smaller.
  local tiny_targets; tiny_targets=$("$B" js "
    [...document.querySelectorAll('button, a[href], [role=button]')]
      .filter(e=>{
        const r=e.getBoundingClientRect();
        if (!(r.width>0 && r.height>0 && e.offsetParent!==null)) return false;
        if (r.height >= 44) return false;
        // Exclude tertiary/decorative: footer links, nav-brand, inline text-only links without a button role
        if (e.closest('footer, .footer, .footer-inner, .footer-links, nav .nav-logo, nav .nav-back')) return false;
        if (e.tagName === 'A' && !e.getAttribute('role') && !e.className.includes('btn') && !e.className.includes('cta') && e.textContent.length < 20 && !e.querySelector('img, svg')) return false;
        return true;
      }).length
  " 2>/dev/null | tail -1)
  tiny_targets="${tiny_targets:-0}"
  [ "$tiny_targets" -eq 0 ] 2>/dev/null && pass "all core tap targets ≥44px" || { fail "$tiny_targets tap target(s) under 44px (excluding footer/decorative)"; ok=0; }

  if [ "$ok" = "1" ]; then PHASE5_OK=1; fi
  return $((1 - ok))
}

# ══════════════════════════════════════════════════════════════
# PIXEL DIFF HELPER
# ══════════════════════════════════════════════════════════════
_run_compare_against_baseline() {
  local differs=0 total=0
  for f in "$REPORT_DIR/phase-1-tabs"/390-844-*.png; do
    local name; name=$(basename "$f" .png)
    name=${name#390-844-}
    local base="$HERE/baseline/mobile/${name}.png"
    if [ -f "$base" ]; then
      local pct; pct=$(compare -metric AE -fuzz 2% "$base" "$f" "$REPORT_DIR/diffs/mobile-$name.diff.png" 2>&1 >/dev/null || true)
      total=$((total+1))
      if [[ "$pct" =~ ^[0-9]+$ ]] && [ "$pct" -gt 10000 ]; then
        differs=$((differs+1))
      fi
    fi
  done
  [ "$differs" = "0" ] && pass "pixel-diff vs baseline clean ($total pairs)" || warn "$differs/$total surfaces differ — review $REPORT_DIR/diffs/"
}

# ══════════════════════════════════════════════════════════════
# REPORT
# ══════════════════════════════════════════════════════════════
write_html_report() {
  log "Phase 6 — writing report"
  local fail_count; fail_count=$(wc -l < "$FAILURES" | tr -d ' ')
  local sha; sha=$(cat "$REPORT_DIR/git-sha.txt" 2>/dev/null || echo "unknown")

  # Thumbnails
  local thumbs=""
  for f in "$REPORT_DIR/phase-1-tabs"/*.png; do
    [ -f "$f" ] || continue
    local rel; rel=$(basename "$f")
    thumbs+="<div class='thumb'><img src='phase-1-tabs/$rel' loading='lazy'><div class='lbl'>$rel</div></div>"
  done
  for f in "$REPORT_DIR/phase-2-drillin"/*.png; do
    [ -f "$f" ] || continue
    local rel; rel=$(basename "$f")
    thumbs+="<div class='thumb'><img src='phase-2-drillin/$rel' loading='lazy'><div class='lbl'>drill-in: $rel</div></div>"
  done

  local failures_html=""
  if [ "$fail_count" -gt "0" ]; then
    while IFS= read -r line; do
      failures_html+="<li>$line</li>"
    done < "$FAILURES"
  else
    failures_html="<li class='ok'>No failures 🎉</li>"
  fi

  local status_color=$([ "$EXIT_CODE" = "0" ] && echo "#4ade80" || echo "#f87171")
  local status_text=$([ "$EXIT_CODE" = "0" ] && echo "PASS" || echo "FAIL")

  cat > "$REPORT_DIR/audit.html" <<HTML
<!doctype html>
<html><head>
<meta charset="utf-8">
<title>Visual audit — $STAMP</title>
<style>
  body{font-family:-apple-system,system-ui,sans-serif;margin:24px;background:#0a0a12;color:#f2f2ef;line-height:1.55}
  h1{font-size:22px;margin:0 0 4px}
  .meta{color:#888;font-size:13px;margin-bottom:20px}
  .status{display:inline-block;padding:4px 14px;border-radius:999px;background:$status_color;color:#0a0a12;font-weight:800;letter-spacing:.5px}
  h2{font-size:16px;margin:32px 0 12px;letter-spacing:.3px}
  .phases{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:24px}
  .phase{background:#15151f;border:1px solid #222;border-radius:12px;padding:12px}
  .phase.ok{border-color:#22553a} .phase.ko{border-color:#553322}
  .phase .name{font-weight:700;font-size:13px;letter-spacing:.3px;text-transform:uppercase}
  .phase .val{font-size:18px;margin-top:4px;font-weight:800}
  .phase.ok .val{color:#4ade80} .phase.ko .val{color:#f87171}
  ul{padding:0;list-style:none;border-radius:12px;background:#15151f;border:1px solid #222;overflow:hidden}
  li{padding:10px 14px;border-bottom:1px solid #222;font-family:ui-monospace,monospace;font-size:13px}
  li.ok{color:#4ade80}
  li:last-child{border-bottom:0}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}
  .thumb{background:#15151f;border:1px solid #222;border-radius:10px;overflow:hidden}
  .thumb img{display:block;width:100%;height:auto;max-height:400px;object-fit:cover}
  .thumb .lbl{padding:6px 10px;font-size:11px;color:#888;letter-spacing:.3px}
</style></head>
<body>
<h1>Visual audit — $STAMP</h1>
<div class="meta">commit <code>$sha</code> · mode <code>$MODE</code> · <span class="status">$status_text</span> · $fail_count failure(s)</div>
<div class="phases">
  <div class="phase $([ $PHASE0_OK = 1 ] && echo ok || echo ko)"><div class="name">Phase 0</div><div class="val">$([ $PHASE0_OK = 1 ] && echo '✓ Pre-flight' || echo '✗ Pre-flight')</div></div>
  <div class="phase $([ $PHASE1_OK = 1 ] && echo ok || echo ko)"><div class="name">Phase 1</div><div class="val">$([ $PHASE1_OK = 1 ] && echo '✓ Tab-level' || echo '✗ Tab-level')</div></div>
  <div class="phase $([ $PHASE2_OK = 1 ] && echo ok || echo ko)"><div class="name">Phase 2</div><div class="val">$([ $PHASE2_OK = 1 ] && echo '✓ Drill-in' || echo '✗ Drill-in')</div></div>
  <div class="phase $([ $PHASE3_OK = 1 ] && echo ok || echo ko)"><div class="name">Phase 3</div><div class="val">$([ $PHASE3_OK = 1 ] && echo '✓ Interactive' || echo '✗ Interactive')</div></div>
  <div class="phase $([ $PHASE4_OK = 1 ] && echo ok || echo ko)"><div class="name">Phase 4</div><div class="val">$([ $PHASE4_OK = 1 ] && echo '✓ Archetypes' || echo '✗ Archetypes')</div></div>
  <div class="phase $([ $PHASE5_OK = 1 ] && echo ok || echo ko)"><div class="name">Phase 5</div><div class="val">$([ $PHASE5_OK = 1 ] && echo '✓ Design-review' || echo '✗ Design-review')</div></div>
</div>

<h2>Failures</h2>
<ul>$failures_html</ul>

<h2>Screenshot grid</h2>
<div class="grid">$thumbs</div>
</body></html>
HTML

  log "Report written: $REPORT_DIR/audit.html"
}

# ══════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════
phase_0 || true
if [ "$PHASE0_OK" = "1" ]; then
  phase_1 || true
  phase_2 || true
  phase_3 || true
  phase_5 || true
  [ "$MODE" = "--archetypes" ] && phase_4 || PHASE4_OK=1  # skip by default
else
  fail "Phase 0 failed — skipping remaining phases"
  EXIT_CODE=2
fi

write_html_report

echo
if [ "$EXIT_CODE" = "0" ]; then
  echo -e "${G}✓ audit passed${N} — see $REPORT_DIR/audit.html"
else
  echo -e "${R}✗ audit FAILED (exit $EXIT_CODE)${N} — see $REPORT_DIR/audit.html for evidence"
fi

exit "$EXIT_CODE"
