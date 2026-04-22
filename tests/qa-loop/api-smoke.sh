#!/usr/bin/env bash
# tests/qa-loop/api-smoke.sh — curl every backend endpoint and verify
# it returns the EXPECTED response, including graceful-503 states.
#
# Runs in ~10 seconds against prod. No auth tokens required; uses the
# 'graceful 503' contract we established across all services.
#
# Exit 0 = all pass. Non-zero = (number of failures).

set -uo pipefail
BE="${BE:-https://tripai-backend.vercel.app}"
ORIGIN="${ORIGIN:-https://tripva.app}"
FIXTURE="${FIXTURE:-a2ba2994227e63956443c06529543317}"

R='\033[0;31m'; G='\033[0;32m'; Y='\033[1;33m'; C='\033[0;36m'; N='\033[0m'
pass() { echo -e "  ${G}✓${N} $*"; }
fail() { echo -e "  ${R}✗${N} $*"; FAILS=$((FAILS+1)); }
warn() { echo -e "  ${Y}!${N} $*"; }

FAILS=0
echo -e "${C}━━━ Tripva API smoke — $BE ━━━${N}"

# 1. health — must be 200
code=$(curl -s -o /dev/null -w "%{http_code}" "$BE/api/health")
[ "$code" = "200" ] && pass "GET /api/health → 200" || fail "GET /api/health → $code (expected 200)"

# 2. stats — must be 200, returns {trips: number}
body=$(curl -s "$BE/api/stats")
echo "$body" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); assert isinstance(d.get('trips'), int), 'trips not int'" 2>/dev/null \
  && pass "GET /api/stats → 200 with {trips:N}" || fail "GET /api/stats bad shape: $body"

# 3. trip fixture — must be 200 and contain rawPlan
code=$(curl -s -o /dev/null -w "%{http_code}" "$BE/api/trip?id=$FIXTURE")
body=$(curl -s "$BE/api/trip?id=$FIXTURE")
if [ "$code" = "200" ] && echo "$body" | grep -q '"rawPlan"'; then
  pass "GET /api/trip?id=$FIXTURE → 200 with rawPlan"
else
  fail "GET /api/trip?id=$FIXTURE → $code (shape wrong or not found)"
fi

# 4. trip not-found — must be 404
code=$(curl -s -o /dev/null -w "%{http_code}" "$BE/api/trip?id=definitely-does-not-exist-xyz")
[ "$code" = "404" ] && pass "GET /api/trip?id=<bad> → 404" || fail "GET /api/trip?id=<bad> → $code (expected 404)"

# 5. og image — must be 200 and image/png
ct=$(curl -s -o /dev/null -w "%{content_type}" "$BE/api/og?id=$FIXTURE")
if [[ "$ct" == image/png* ]]; then
  pass "GET /api/og?id=$FIXTURE → image/png"
else
  fail "GET /api/og → content-type '$ct' (expected image/png)"
fi

# 6. packing — POST with valid body, expect 200 with categories
resp=$(curl -s -X POST "$BE/api/packing" -H "Content-Type: application/json" -H "Origin: $ORIGIN" \
  -d "{\"destination\":\"Paris\",\"startDate\":\"2026-06-15\",\"endDate\":\"2026-06-18\",\"travelers\":2}")
if echo "$resp" | python3 -c "import sys,json; d=json.loads(sys.stdin.read()); assert isinstance(d.get('categories'), list) and len(d['categories'])>0, 'no categories'" 2>/dev/null; then
  pass "POST /api/packing → 200 with categories"
else
  fail "POST /api/packing bad shape: $(echo $resp | head -c 150)"
fi

# 7. packing with bad date format — must be 400
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BE/api/packing" \
  -H "Content-Type: application/json" -H "Origin: $ORIGIN" \
  -d "{\"destination\":\"Paris\",\"startDate\":\"Apr 20\"}")
[ "$code" = "400" ] && pass "POST /api/packing (bad date) → 400" || fail "POST /api/packing (bad date) → $code (expected 400)"

# 8. user/me — no token → 401
code=$(curl -s -o /dev/null -w "%{http_code}" "$BE/api/user/me")
[ "$code" = "401" ] && pass "GET /api/user/me (no token) → 401" || fail "GET /api/user/me → $code (expected 401)"

# 9. user/trips — no token → 401
code=$(curl -s -o /dev/null -w "%{http_code}" "$BE/api/user/trips")
[ "$code" = "401" ] && pass "GET /api/user/trips (no token) → 401" || fail "GET /api/user/trips → $code (expected 401)"

# 10. user/oauth — Supabase provider status. Passes on either 200 (Supabase
#     has Google enabled) or 503 provider_not_enabled (still graceful).
resp=$(curl -s -X POST "$BE/api/user/oauth" -H "Content-Type: application/json" -H "Origin: $ORIGIN" -d '{"provider":"google"}')
if echo "$resp" | grep -qE '"url":|provider_not_enabled'; then
  pass "POST /api/user/oauth google → URL or graceful 503"
else
  fail "POST /api/user/oauth unexpected: $(echo $resp | head -c 150)"
fi

# 11. admin/analytics — no token → 401 OR 503 (either graceful)
code=$(curl -s -o /dev/null -w "%{http_code}" "$BE/api/admin/analytics")
if [ "$code" = "401" ] || [ "$code" = "503" ]; then
  pass "GET /api/admin/analytics (no token) → $code (graceful)"
else
  fail "GET /api/admin/analytics → $code (expected 401 or 503)"
fi

# 12. stripe/checkout — no auth → 401 OR 503 (both graceful)
resp=$(curl -s -w "%{http_code}" -o /tmp/_sr -X POST "$BE/api/stripe/checkout" \
  -H "Content-Type: application/json" -H "Origin: $ORIGIN" -d '{}')
if [ "$resp" = "401" ] || [ "$resp" = "503" ]; then
  pass "POST /api/stripe/checkout → $resp (graceful)"
else
  fail "POST /api/stripe/checkout → $resp (expected 401 or 503)"
fi

# 13. push/public-key — 200 with publicKey OR 503 (if VAPID not configured)
resp=$(curl -s "$BE/api/push/public-key")
if echo "$resp" | grep -qE '"publicKey":|push_not_configured'; then
  pass "GET /api/push/public-key → key or graceful 503"
else
  fail "GET /api/push/public-key unexpected: $(echo $resp | head -c 150)"
fi

# 14. push/send-daily with x-vercel-cron header — 200 or graceful 503
resp=$(curl -s -w "HTTPCODE:%{http_code}" -X POST "$BE/api/push/send-daily" -H "x-vercel-cron: 1")
code=$(echo "$resp" | grep -oE 'HTTPCODE:[0-9]+' | cut -d: -f2)
body=$(echo "$resp" | sed 's/HTTPCODE:[0-9]*$//')
if [ "$code" = "200" ] || [ "$code" = "503" ]; then
  pass "POST /api/push/send-daily (cron) → $code"
else
  fail "POST /api/push/send-daily → $code · $body"
fi

# 15. save — round-trip a tiny plan, verify the returned id resolves
resp=$(curl -s -X POST "$BE/api/save" -H "Content-Type: application/json" -H "Origin: $ORIGIN" \
  -d '{"plan":{"trip":{"name":"smoke test","destination":"Nowhere"},"days":[],"hotels":[],"budget":[]}}')
saveId=$(echo "$resp" | python3 -c "import sys,json; print(json.loads(sys.stdin.read()).get('id',''))" 2>/dev/null)
if [ -n "$saveId" ]; then
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BE/api/trip?id=$saveId")
  [ "$code" = "200" ] && pass "POST /api/save → id=$saveId resolves 200" \
    || fail "POST /api/save returned $saveId but /api/trip?id=$saveId → $code"
else
  fail "POST /api/save no id returned: $(echo $resp | head -c 150)"
fi

echo ""
if [ "$FAILS" = "0" ]; then
  echo -e "${G}✓ API smoke PASSED${N} — 15/15 endpoints"
  exit 0
else
  echo -e "${R}✗ API smoke FAILED${N} — $FAILS of 15 failed"
  exit "$FAILS"
fi
