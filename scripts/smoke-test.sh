#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Voqal API Smoke Tests
# Usage: bash scripts/smoke-test.sh [BASE_URL]
# Default BASE_URL: http://localhost:8000
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BASE="${1:-http://localhost:8000}"
PASS=0
FAIL=0

green() { printf "\033[32m✓ %s\033[0m\n" "$*"; }
red()   { printf "\033[31m✗ %s\033[0m\n" "$*"; }

check() {
  local label="$1"
  local url="$2"
  local method="${3:-GET}"
  local body="${4:-}"
  local expected_status="${5:-200}"

  if [ -n "$body" ]; then
    status=$(curl -s -o /tmp/voqal_resp -w "%{http_code}" -X "$method" \
      -H "Content-Type: application/json" -d "$body" "$url")
  else
    status=$(curl -s -o /tmp/voqal_resp -w "%{http_code}" -X "$method" "$url")
  fi

  if [ "$status" = "$expected_status" ]; then
    green "$label  [$status]"
    PASS=$((PASS+1))
  else
    red "$label  [expected $expected_status, got $status]"
    cat /tmp/voqal_resp | python3 -m json.tool 2>/dev/null || cat /tmp/voqal_resp
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Voqal API Smoke Tests"
echo "  Base URL: $BASE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Health ─────────────────────────────────────────────────────────────────
check "Health check"           "$BASE/health"

# ── Calls ──────────────────────────────────────────────────────────────────
CALL_RESP=$(curl -s -X POST "$BASE/api/v1/calls/receive" \
  -H "Content-Type: application/json" \
  -d '{"phone_number": "+15550100099", "caller_name": "Smoke Test"}')

CALL_ID=$(echo "$CALL_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('call_id',''))" 2>/dev/null || echo "")

if [ -n "$CALL_ID" ]; then
  green "POST /calls/receive  [201] call_id=$CALL_ID"
  PASS=$((PASS+1))
else
  red "POST /calls/receive  [failed to parse call_id]"
  echo "$CALL_RESP"
  FAIL=$((FAIL+1))
fi

check "GET /calls/active"    "$BASE/api/v1/calls/active"
check "GET /calls/history"   "$BASE/api/v1/calls/history?limit=5"

if [ -n "$CALL_ID" ]; then
  check "GET /calls/:id"       "$BASE/api/v1/calls/$CALL_ID"
fi

# ── Leads ──────────────────────────────────────────────────────────────────
check "GET /leads"           "$BASE/api/v1/leads"
check "GET /leads/qualified" "$BASE/api/v1/leads/qualified"

# ── CRM ────────────────────────────────────────────────────────────────────
check "GET /crm/status"      "$BASE/api/v1/crm/status"

# ── Analytics ──────────────────────────────────────────────────────────────
check "GET /analytics/dashboard"   "$BASE/api/v1/analytics/dashboard"
check "GET /analytics/daily"       "$BASE/api/v1/analytics/daily?days=7"
check "GET /analytics/top-intents" "$BASE/api/v1/analytics/top-intents"
check "GET /analytics/lead-funnel" "$BASE/api/v1/analytics/lead-funnel"

REPORT_FROM=$(date -v-7d +%Y-%m-%d 2>/dev/null || date -d '7 days ago' +%Y-%m-%d)
REPORT_TO=$(date +%Y-%m-%d)
check "GET /analytics/report" \
  "$BASE/api/v1/analytics/report?date_from=${REPORT_FROM}&date_to=${REPORT_TO}"

# ── Summary ────────────────────────────────────────────────────────────────
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Results: $PASS passed, $FAIL failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

[ $FAIL -eq 0 ] && exit 0 || exit 1
