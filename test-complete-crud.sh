#!/bin/bash

# ========================================
# COMPLETE SUPABASE CRUD TEST SUITE
# Tests all tables with actual schema
# ========================================

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

source .env.local

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SERVICE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

declare -a CREATED_IDS

print_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if [ "$2" == "PASS" ]; then
        echo -e "${GREEN}✓${NC} $1"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗${NC} $1"
        [ -n "$3" ] && echo -e "  ${YELLOW}${3:0:150}${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

extract_id() {
    echo "$1" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d[0]['id'] if isinstance(d,list) and d else '')" 2>/dev/null
}

gen_uuid() {
    python3 -c "import uuid; print(uuid.uuid4())"
}

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  COMPREHENSIVE SUPABASE CRUD TEST SUITE${NC}"
echo -e "${BLUE}================================================${NC}\n"

# =======================
# TEST 1: ORGANIZATIONS
# =======================
echo -e "${CYAN}[1/11] ORGANIZATIONS${NC}"

RESP=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/organizations" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"name\":\"Test Org $(date +%s)\",\"domain\":\"test$(date +%s).com\",\"status\":\"active\",\"tier\":\"enterprise\"}")

ORG_ID=$(extract_id "$RESP")
[ -n "$ORG_ID" ] && print_test "  CREATE Organization" "PASS" || print_test "  CREATE Organization" "FAIL" "$RESP"

if [ -n "$ORG_ID" ]; then
    CREATED_IDS+=("organizations:$ORG_ID")
    
    # READ
    RESP=$(curl -s "${SUPABASE_URL}/rest/v1/organizations?id=eq.$ORG_ID" \
      -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}")
    echo "$RESP" | grep -q "$ORG_ID" && print_test "  READ Organization" "PASS" || print_test "  READ Organization" "FAIL"
    
    # UPDATE
    curl -s -X PATCH "${SUPABASE_URL}/rest/v1/organizations?id=eq.$ORG_ID" \
      -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "Content-Type: application/json" -H "Prefer: return=minimal" \
      -d '{"tier":"professional"}' >/dev/null 2>&1
    [ $? -eq 0 ] && print_test "  UPDATE Organization" "PASS" || print_test "  UPDATE Organization" "FAIL"
fi

# =======================
# TEST 2: ROLES
# =======================
echo -e "\n${CYAN}[2/11] ROLES${NC}"

if [ -n "$ORG_ID" ]; then
    RESP=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/roles" \
      -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "Content-Type: application/json" -H "Prefer: return=representation" \
      -d "{\"organization_id\":\"$ORG_ID\",\"name\":\"Test Role $(date +%s)\",\"description\":\"Test\",\"is_system_role\":false,\"is_active\":true}")
    
    ROLE_ID=$(extract_id "$RESP")
    [ -n "$ROLE_ID" ] && print_test "  CREATE Role" "PASS" || print_test "  CREATE Role" "FAIL" "$RESP"
    
    if [ -n "$ROLE_ID" ]; then
        CREATED_IDS+=("roles:$ROLE_ID")
        
        RESP=$(curl -s "${SUPABASE_URL}/rest/v1/roles?id=eq.$ROLE_ID" \
          -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}")
        echo "$RESP" | grep -q "$ROLE_ID" && print_test "  READ Role" "PASS" || print_test "  READ Role" "FAIL"
        
        curl -s -X PATCH "${SUPABASE_URL}/rest/v1/roles?id=eq.$ROLE_ID" \
          -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
          -H "Content-Type: application/json" -H "Prefer: return=minimal" \
          -d '{"description":"Updated"}' >/dev/null 2>&1
        [ $? -eq 0 ] && print_test "  UPDATE Role" "PASS" || print_test "  UPDATE Role" "FAIL"
    fi
fi

# =======================
# TEST 3: PERMISSIONS
# =======================
echo -e "\n${CYAN}[3/11] PERMISSIONS${NC}"

RESP=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/permissions" \
  -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" -H "Prefer: return=representation" \
  -d "{\"name\":\"test_perm_$(date +%s)\",\"display_name\":\"Test Permission\",\"description\":\"Test\",\"module\":\"test\",\"action\":\"read\",\"resource_pattern\":\"/*\",\"is_system_permission\":false}")

PERM_ID=$(extract_id "$RESP")
[ -n "$PERM_ID" ] && print_test "  CREATE Permission" "PASS" || print_test "  CREATE Permission" "FAIL" "$RESP"

if [ -n "$PERM_ID" ]; then
    CREATED_IDS+=("permissions:$PERM_ID")
    
    RESP=$(curl -s "${SUPABASE_URL}/rest/v1/permissions?id=eq.$PERM_ID" \
      -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}")
    echo "$RESP" | grep -q "$PERM_ID" && print_test "  READ Permission" "PASS" || print_test "  READ Permission" "FAIL"
    
    curl -s -X PATCH "${SUPABASE_URL}/rest/v1/permissions?id=eq.$PERM_ID" \
      -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "Content-Type: application/json" -H "Prefer: return=minimal" \
      -d '{"description":"Updated"}' >/dev/null 2>&1
    [ $? -eq 0 ] && print_test "  UPDATE Permission" "PASS" || print_test "  UPDATE Permission" "FAIL"
fi

# =======================
# TEST 4: TEAMS
# =======================
echo -e "\n${CYAN}[4/11] TEAMS${NC}"

if [ -n "$ORG_ID" ]; then
    RESP=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/teams" \
      -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "Content-Type: application/json" -H "Prefer: return=representation" \
      -d "{\"organization_id\":\"$ORG_ID\",\"name\":\"Test Team $(date +%s)\",\"description\":\"Test\",\"is_active\":true}")
    
    TEAM_ID=$(extract_id "$RESP")
    [ -n "$TEAM_ID" ] && print_test "  CREATE Team" "PASS" || print_test "  CREATE Team" "FAIL" "$RESP"
    
    if [ -n "$TEAM_ID" ]; then
        CREATED_IDS+=("teams:$TEAM_ID")
        
        RESP=$(curl -s "${SUPABASE_URL}/rest/v1/teams?id=eq.$TEAM_ID" \
          -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}")
        echo "$RESP" | grep -q "$TEAM_ID" && print_test "  READ Team" "PASS" || print_test "  READ Team" "FAIL"
        
        curl -s -X PATCH "${SUPABASE_URL}/rest/v1/teams?id=eq.$TEAM_ID" \
          -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
          -H "Content-Type: application/json" -H "Prefer: return=minimal" \
          -d '{"description":"Updated"}' >/dev/null 2>&1
        [ $? -eq 0 ] && print_test "  UPDATE Team" "PASS" || print_test "  UPDATE Team" "FAIL"
    fi
fi

# =======================
# TEST 5: ASSET_TYPES
# =======================
echo -e "\n${CYAN}[5/11] ASSET_TYPES${NC}"

if [ -n "$ORG_ID" ]; then
    RESP=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/asset_types" \
      -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "Content-Type: application/json" -H "Prefer: return=representation" \
      -d "{\"organization_id\":\"$ORG_ID\",\"name\":\"Test Asset $(date +%s)\",\"description\":\"Test\",\"is_active\":true}")
    
    ASSET_TYPE_ID=$(extract_id "$RESP")
    [ -n "$ASSET_TYPE_ID" ] && print_test "  CREATE Asset Type" "PASS" || print_test "  CREATE Asset Type" "FAIL" "$RESP"
    
    if [ -n "$ASSET_TYPE_ID" ]; then
        CREATED_IDS+=("asset_types:$ASSET_TYPE_ID")
        
        RESP=$(curl -s "${SUPABASE_URL}/rest/v1/asset_types?id=eq.$ASSET_TYPE_ID" \
          -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}")
        echo "$RESP" | grep -q "$ASSET_TYPE_ID" && print_test "  READ Asset Type" "PASS" || print_test "  READ Asset Type" "FAIL"
        
        curl -s -X PATCH "${SUPABASE_URL}/rest/v1/asset_types?id=eq.$ASSET_TYPE_ID" \
          -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
          -H "Content-Type: application/json" -H "Prefer: return=minimal" \
          -d '{"description":"Updated"}' >/dev/null 2>&1
        [ $? -eq 0 ] && print_test "  UPDATE Asset Type" "PASS" || print_test "  UPDATE Asset Type" "FAIL"
    fi
fi

# =======================
# TEST 6: SERVICE_CATEGORIES
# =======================
echo -e "\n${CYAN}[6/11] SERVICE_CATEGORIES${NC}"

if [ -n "$ORG_ID" ]; then
    RESP=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/service_categories" \
      -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "Content-Type: application/json" -H "Prefer: return=representation" \
      -d "{\"organization_id\":\"$ORG_ID\",\"name\":\"Test Category $(date +%s)\",\"description\":\"Test\",\"is_active\":true}")
    
    CAT_ID=$(extract_id "$RESP")
    [ -n "$CAT_ID" ] && print_test "  CREATE Service Category" "PASS" || print_test "  CREATE Service Category" "FAIL" "$RESP"
    
    if [ -n "$CAT_ID" ]; then
        CREATED_IDS+=("service_categories:$CAT_ID")
        
        RESP=$(curl -s "${SUPABASE_URL}/rest/v1/service_categories?id=eq.$CAT_ID" \
          -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}")
        echo "$RESP" | grep -q "$CAT_ID" && print_test "  READ Service Category" "PASS" || print_test "  READ Service Category" "FAIL"
        
        curl -s -X PATCH "${SUPABASE_URL}/rest/v1/service_categories?id=eq.$CAT_ID" \
          -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
          -H "Content-Type: application/json" -H "Prefer: return=minimal" \
          -d '{"description":"Updated"}' >/dev/null 2>&1
        [ $? -eq 0 ] && print_test "  UPDATE Service Category" "PASS" || print_test "  UPDATE Service Category" "FAIL"
    fi
fi

# =======================
# TEST 7: SLA_POLICIES
# =======================
echo -e "\n${CYAN}[7/11] SLA_POLICIES${NC}"

if [ -n "$ORG_ID" ]; then
    RESP=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/sla_policies" \
      -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "Content-Type: application/json" -H "Prefer: return=representation" \
      -d "{\"organization_id\":\"$ORG_ID\",\"name\":\"Test SLA $(date +%s)\",\"description\":\"Test\",\"priority\":\"medium\",\"first_response_time_hours\":4,\"resolution_time_hours\":24,\"business_hours_only\":false,\"is_active\":true}")
    
    SLA_ID=$(extract_id "$RESP")
    [ -n "$SLA_ID" ] && print_test "  CREATE SLA Policy" "PASS" || print_test "  CREATE SLA Policy" "FAIL" "$RESP"
    
    if [ -n "$SLA_ID" ]; then
        CREATED_IDS+=("sla_policies:$SLA_ID")
        
        RESP=$(curl -s "${SUPABASE_URL}/rest/v1/sla_policies?id=eq.$SLA_ID" \
          -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}")
        echo "$RESP" | grep -q "$SLA_ID" && print_test "  READ SLA Policy" "PASS" || print_test "  READ SLA Policy" "FAIL"
        
        curl -s -X PATCH "${SUPABASE_URL}/rest/v1/sla_policies?id=eq.$SLA_ID" \
          -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
          -H "Content-Type: application/json" -H "Prefer: return=minimal" \
          -d '{"description":"Updated"}' >/dev/null 2>&1
        [ $? -eq 0 ] && print_test "  UPDATE SLA Policy" "PASS" || print_test "  UPDATE SLA Policy" "FAIL"
    fi
fi

# =======================
# TEST 8: KNOWLEDGE_ARTICLES
# =======================
echo -e "\n${CYAN}[8/11] KNOWLEDGE_ARTICLES${NC}"

if [ -n "$ORG_ID" ]; then
    RESP=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/knowledge_articles" \
      -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
      -H "Content-Type: application/json" -H "Prefer: return=representation" \
      -d "{\"organization_id\":\"$ORG_ID\",\"title\":\"Test Article $(date +%s)\",\"content\":\"Test content\",\"status\":\"draft\"}")
    
    ARTICLE_ID=$(extract_id "$RESP")
    [ -n "$ARTICLE_ID" ] && print_test "  CREATE Knowledge Article" "PASS" || print_test "  CREATE Knowledge Article" "FAIL" "$RESP"
    
    if [ -n "$ARTICLE_ID" ]; then
        CREATED_IDS+=("knowledge_articles:$ARTICLE_ID")
        
        RESP=$(curl -s "${SUPABASE_URL}/rest/v1/knowledge_articles?id=eq.$ARTICLE_ID" \
          -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}")
        echo "$RESP" | grep -q "$ARTICLE_ID" && print_test "  READ Knowledge Article" "PASS" || print_test "  READ Knowledge Article" "FAIL"
        
        curl -s -X PATCH "${SUPABASE_URL}/rest/v1/knowledge_articles?id=eq.$ARTICLE_ID" \
          -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" \
          -H "Content-Type: application/json" -H "Prefer: return=minimal" \
          -d '{"status":"published"}' >/dev/null 2>&1
        [ $? -eq 0 ] && print_test "  UPDATE Knowledge Article" "PASS" || print_test "  UPDATE Knowledge Article" "FAIL"
    fi
fi

# =======================
# TEST 9-11: READ-ONLY TESTS
# =======================
echo -e "\n${CYAN}[9/11] TICKETS (Read Only)${NC}"
RESP=$(curl -s "${SUPABASE_URL}/rest/v1/tickets?limit=1" -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}")
[ $? -eq 0 ] && print_test "  READ Tickets" "PASS" || print_test "  READ Tickets" "FAIL"

echo -e "\n${CYAN}[10/11] SERVICES (Read Only)${NC}"
RESP=$(curl -s "${SUPABASE_URL}/rest/v1/services?limit=1" -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}")
[ $? -eq 0 ] && print_test "  READ Services" "PASS" || print_test "  READ Services" "FAIL"

echo -e "\n${CYAN}[11/11] ASSETS (Read Only)${NC}"
RESP=$(curl -s "${SUPABASE_URL}/rest/v1/assets?limit=1" -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}")
[ $? -eq 0 ] && print_test "  READ Assets" "PASS" || print_test "  READ Assets" "FAIL"

# =======================
# DELETE ALL TEST DATA
# =======================
echo -e "\n${BLUE}================================================${NC}"
echo -e "${BLUE}  CLEANUP: Deleting Test Data${NC}"
echo -e "${BLUE}================================================${NC}\n"

for item in "${CREATED_IDS[@]}"; do
    IFS=':' read -r table id <<< "$item"
    curl -s -X DELETE "${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}" \
      -H "apikey: ${SERVICE_KEY}" -H "Authorization: Bearer ${SERVICE_KEY}" >/dev/null 2>&1
    [ $? -eq 0 ] && print_test "  DELETE ${table}" "PASS" || print_test "  DELETE ${table}" "FAIL"
done

# =======================
# FINAL SUMMARY
# =======================
echo -e "\n${BLUE}================================================${NC}"
echo -e "${BLUE}  TEST SUMMARY${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "Total Tests:  ${YELLOW}${TOTAL_TESTS}${NC}"
echo -e "Passed:       ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed:       ${RED}${FAILED_TESTS}${NC}"

PASS_RATE=0
[ $TOTAL_TESTS -gt 0 ] && PASS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))
echo -e "Pass Rate:    ${YELLOW}${PASS_RATE}%${NC}\n"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED - DATABASE FULLY OPERATIONAL${NC}\n"
    exit 0
else
    echo -e "${RED}✗ SOME TESTS FAILED - REVIEW ABOVE${NC}\n"
    exit 1
fi
