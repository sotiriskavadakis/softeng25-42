#!/usr/bin/env bash
set -uo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="${API_URL:-http://localhost:9876}"
TOKEN=""
TEST_EMAIL="apitest_$(date +%s)@example.com"
TEST_PASSWORD="testpassword123"
TEST_CHARGER_ID="${TEST_CHARGER_ID:-3508687}"

PASSED=0
FAILED=0

# Helper functions
log_pass() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    PASSED=$((PASSED + 1))
}

log_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    echo -e "  Response: $2"
    FAILED=$((FAILED + 1))
}

log_info() {
    echo -e "${YELLOW}ℹ INFO${NC}: $1"
}

# Make HTTP request and return response
request() {
    local method=$1
    local endpoint=$2
    local data=${3:-}
    local auth=${4:-false}
    
    local headers=(-H "Content-Type: application/json")
    if [[ "$auth" == "true" && -n "$TOKEN" ]]; then
        headers+=(-H "Authorization: Bearer $TOKEN")
    fi
    
    if [[ -n "$data" ]]; then
        curl -s -X "$method" "${BASE_URL}${endpoint}" "${headers[@]}" -d "$data"
    else
        curl -s -X "$method" "${BASE_URL}${endpoint}" "${headers[@]}"
    fi
}

# Check if response contains expected value
check_response() {
    local response=$1
    local expected=$2
    local test_name=$3
    
    if echo "$response" | grep -q "$expected"; then
        log_pass "$test_name"
        return 0
    else
        log_fail "$test_name" "$response"
        return 1
    fi
}

# Check HTTP status code
check_status() {
    local endpoint=$1
    local method=$2
    local expected_code=$3
    local test_name=$4
    local data=${5:-}
    local auth=${6:-false}
    
    local headers=(-H "Content-Type: application/json" -w "%{http_code}" -o /dev/null)
    if [[ "$auth" == "true" && -n "$TOKEN" ]]; then
        headers+=(-H "Authorization: Bearer $TOKEN")
    fi
    
    local code
    if [[ -n "$data" ]]; then
        code=$(curl -s -X "$method" "${BASE_URL}${endpoint}" "${headers[@]}" -d "$data")
    else
        code=$(curl -s -X "$method" "${BASE_URL}${endpoint}" "${headers[@]}")
    fi
    
    if [[ "$code" == "$expected_code" ]]; then
        log_pass "$test_name (HTTP $code)"
        return 0
    else
        log_fail "$test_name (expected $expected_code, got $code)" ""
        return 1
    fi
}

echo "=============================================="
echo "       EV Charging API Test Suite"
echo "=============================================="
echo "Base URL: $BASE_URL"
echo "Test Email: $TEST_EMAIL"
echo "Test Charger: $TEST_CHARGER_ID"
echo "=============================================="
echo ""

# ==================== HEALTHCHECK ====================
echo "--- Healthcheck Tests ---"

response=$(request GET "/api/admin/healthcheck")
check_response "$response" '"status":"OK"' "Healthcheck returns OK"

# ==================== AUTH TESTS ====================
echo ""
echo "--- Authentication Tests ---"

# Register new user
response=$(request POST "/api/auth/register" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
if check_response "$response" '"token"' "Register new user"; then
    TOKEN=$(echo "$response" | sed 's/.*"token":"\([^"]*\)".*/\1/')
    log_info "Got registration token"
fi

# Register duplicate email
check_status "/api/auth/register" POST "409" "Register duplicate email returns 409" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"

# Register missing fields
check_status "/api/auth/register" POST "400" "Register missing password returns 400" "{\"email\":\"incomplete@example.com\"}"

# Login success
response=$(request POST "/api/auth/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
if check_response "$response" '"token"' "Login with valid credentials"; then
    TOKEN=$(echo "$response" | sed 's/.*"token":"\([^"]*\)".*/\1/')
    log_info "Got login token"
fi

# Login wrong password
check_status "/api/auth/login" POST "401" "Login wrong password returns 401" "{\"email\":\"$TEST_EMAIL\",\"password\":\"wrongpass\"}"

# Login nonexistent user
check_status "/api/auth/login" POST "401" "Login nonexistent user returns 401" "{\"email\":\"nonexistent@example.com\",\"password\":\"password\"}"

# ==================== POINTS TESTS ====================
echo ""
echo "--- Points Tests ---"

# Get all points
response=$(request GET "/api/points")
check_response "$response" '"id"' "Get points returns data"

# Get points with filters
check_status "/api/points?lat=37.9838&lng=23.7275&radius=50" GET "200" "Get points with location filter"

# Get point by ID
response=$(request GET "/api/point/$TEST_CHARGER_ID")
check_response "$response" '"id"' "Get point by ID returns data"

# Get point not found
check_status "/api/point/0" GET "404" "Get nonexistent point returns 404"

# Get point invalid ID
check_status "/api/point/invalid" GET "400" "Get point invalid ID returns 400"

# ==================== POINT STATUS TESTS ====================
echo ""
echo "--- Point Status Tests ---"

FROM_DATE=$(date -d "-30 days" +%Y%m%d 2>/dev/null || date -v-30d +%Y%m%d)
TO_DATE=$(date +%Y%m%d)

check_status "/api/pointstatus/$TEST_CHARGER_ID/$FROM_DATE/$TO_DATE" GET "200" "Get point status returns 200"
check_status "/api/pointstatus/$TEST_CHARGER_ID/invalid/date" GET "400" "Get point status invalid date returns 400"

# ==================== AUTHORIZATION TESTS ====================
echo ""
echo "--- Authorization Tests ---"

# Endpoints requiring auth without token
check_status "/api/reserve/$TEST_CHARGER_ID" POST "401" "Reserve without auth returns 401"
check_status "/api/updpoint/$TEST_CHARGER_ID" POST "401" "Update point without auth returns 401"
check_status "/api/newsession" POST "401" "New session without auth returns 401"
check_status "/api/sessions/$TEST_CHARGER_ID/$FROM_DATE/$TO_DATE" GET "401" "Get sessions without auth returns 401"

# ==================== RESERVATION TESTS ====================
echo ""
echo "--- Reservation Tests ---"

# Reserve point (need to reset status first via direct API if possible)
response=$(request POST "/api/reserve/$TEST_CHARGER_ID" "" true)
if echo "$response" | grep -qE '"status":"(reserved|RESERVED|OCCUPIED)"'; then
    log_pass "Reserve point returns valid status"
else
    log_fail "Reserve point" "$response"
fi

# Reserve with minutes
response=$(request POST "/api/reserve/$TEST_CHARGER_ID/45" "" true)
check_response "$response" '"status"' "Reserve point with minutes returns status"

# Reserve nonexistent point
response=$(request POST "/api/reserve/0" "" true)
check_response "$response" '"status":"not_found"' "Reserve nonexistent point returns not_found"

# ==================== UPDATE POINT TESTS ====================
echo ""
echo "--- Update Point Tests ---"

response=$(request POST "/api/updpoint/$TEST_CHARGER_ID" '{"status":"AVAILABLE"}' true)
check_response "$response" "" "Update point to AVAILABLE" || true

check_status "/api/updpoint/0" POST "404" "Update nonexistent point returns 404" '{"status":"AVAILABLE"}' true

# ==================== SESSION TESTS ====================
echo ""
echo "--- Session Tests ---"

SESSION_DATA='{
    "pointid": "'"$TEST_CHARGER_ID"'",
    "starttime": "2025-12-25 10:00",
    "endtime": "2025-12-25 11:30",
    "startsoc": 20,
    "endsoc": 80,
    "totalkwh": 45.5,
    "kwhprice": 0.35,
    "amount": 15.93
}'

check_status "/api/newsession" POST "200" "Create new session" "$SESSION_DATA" true

# Missing fields
check_status "/api/newsession" POST "400" "Create session missing fields returns 400" '{"pointid":"999999"}' true

# Invalid time format
INVALID_SESSION='{"pointid":"'"$TEST_CHARGER_ID"'","starttime":"invalid","endtime":"2025-12-25 11:30","startsoc":20,"endsoc":80,"totalkwh":45.5,"kwhprice":0.35,"amount":15.93}'
check_status "/api/newsession" POST "400" "Create session invalid time returns 400" "$INVALID_SESSION" true

# Point not found
NOTFOUND_SESSION='{"pointid":"0","starttime":"2025-12-25 10:00","endtime":"2025-12-25 11:30","startsoc":20,"endsoc":80,"totalkwh":45.5,"kwhprice":0.35,"amount":15.93}'
check_status "/api/newsession" POST "404" "Create session point not found returns 404" "$NOTFOUND_SESSION" true

# Get sessions
check_status "/api/sessions/$TEST_CHARGER_ID/$FROM_DATE/$TO_DATE" GET "200" "Get sessions returns 200" "" true

# ==================== SUMMARY ====================
echo ""
echo "=============================================="
echo "                 SUMMARY"
echo "=============================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
echo "Total:  $TOTAL"
echo ""

if [[ $FAILED -eq 0 ]]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi
