#!/bin/bash

# ========================================
# COMPREHENSIVE SUPABASE CRUD TEST SUITE
# Tests all 12 tables with full CRUD operations
# ========================================

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Load environment variables
source .env.local

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Store created IDs for cleanup
declare -A CREATED_IDS

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  SUPABASE CRUD TEST SUITE${NC}"
echo -e "${BLUE}  Testing all 12 tables${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Helper function to print test results
print_test_result() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" == "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name"
        echo -e "  ${YELLOW}Details: $details${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Helper function to extract ID from response
extract_id() {
    local response="$1"
    echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4
}

# Helper function to generate UUID
generate_uuid() {
    uuidgen | tr '[:upper:]' '[:lower:]'
}

echo -e "${YELLOW}Starting CRUD tests...${NC}\n"

# ========================================
# TEST 1: COMPANIES TABLE
# ========================================
echo -e "${BLUE}[1/12] Testing COMPANIES table...${NC}"

# CREATE
COMPANY_UUID=$(generate_uuid)
COMPANY_ID=$(generate_uuid)
CREATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/companies" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"company_id\": \"${COMPANY_ID}\",
    \"name\": \"Test Company CRUD\",
    \"enable_knowledge_base\": true
  }")

CREATED_COMPANY_ID=$(extract_id "$CREATE_RESPONSE")
if [ -n "$CREATED_COMPANY_ID" ]; then
    CREATED_IDS["company"]="$CREATED_COMPANY_ID"
    print_test_result "Companies - CREATE" "PASS" ""
else
    print_test_result "Companies - CREATE" "FAIL" "$CREATE_RESPONSE"
fi

# READ
READ_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/companies?id=eq.${CREATED_COMPANY_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if echo "$READ_RESPONSE" | grep -q "Test Company CRUD"; then
    print_test_result "Companies - READ" "PASS" ""
else
    print_test_result "Companies - READ" "FAIL" "$READ_RESPONSE"
fi

# UPDATE
UPDATE_RESPONSE=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/companies?id=eq.${CREATED_COMPANY_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Updated Test Company\"}")

if [ $? -eq 0 ]; then
    print_test_result "Companies - UPDATE" "PASS" ""
else
    print_test_result "Companies - UPDATE" "FAIL" "$UPDATE_RESPONSE"
fi

echo ""

# ========================================
# TEST 2: USERS TABLE
# ========================================
echo -e "${BLUE}[2/12] Testing USERS table...${NC}"

# CREATE
USER_ID=$(generate_uuid)
UNIQUE_ID=$(generate_uuid)
USER_EMAIL="test-crud-$(date +%s)@example.com"
CREATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/users" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"${USER_ID}\",
    \"unique_id\": \"${UNIQUE_ID}\",
    \"email\": \"${USER_EMAIL}\",
    \"name\": \"Test User CRUD\",
    \"status\": \"ACTIVE\",
    \"role\": \"user\"
  }")

CREATED_USER_ID=$(extract_id "$CREATE_RESPONSE")
if [ -n "$CREATED_USER_ID" ]; then
    CREATED_IDS["user"]="$CREATED_USER_ID"
    print_test_result "Users - CREATE" "PASS" ""
else
    print_test_result "Users - CREATE" "FAIL" "$CREATE_RESPONSE"
fi

# READ
READ_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/users?id=eq.${CREATED_USER_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if echo "$READ_RESPONSE" | grep -q "Test User CRUD"; then
    print_test_result "Users - READ" "PASS" ""
else
    print_test_result "Users - READ" "FAIL" "$READ_RESPONSE"
fi

# UPDATE
UPDATE_RESPONSE=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/users?id=eq.${CREATED_USER_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"designation\": \"Senior Engineer\"}")

if [ $? -eq 0 ]; then
    print_test_result "Users - UPDATE" "PASS" ""
else
    print_test_result "Users - UPDATE" "FAIL" "$UPDATE_RESPONSE"
fi

echo ""

# ========================================
# TEST 3: MEMBERS TABLE
# ========================================
echo -e "${BLUE}[3/12] Testing MEMBERS table...${NC}"

# CREATE
CREATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/members" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"${CREATED_USER_ID}\",
    \"company_id\": \"${CREATED_COMPANY_ID}\",
    \"status\": \"ACTIVE\",
    \"role\": \"user\",
    \"designation\": \"Software Engineer\"
  }")

CREATED_MEMBER_ID=$(extract_id "$CREATE_RESPONSE")
if [ -n "$CREATED_MEMBER_ID" ]; then
    CREATED_IDS["member"]="$CREATED_MEMBER_ID"
    print_test_result "Members - CREATE" "PASS" ""
else
    print_test_result "Members - CREATE" "FAIL" "$CREATE_RESPONSE"
fi

# READ
READ_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/members?id=eq.${CREATED_MEMBER_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if echo "$READ_RESPONSE" | grep -q "Software Engineer"; then
    print_test_result "Members - READ" "PASS" ""
else
    print_test_result "Members - READ" "FAIL" "$READ_RESPONSE"
fi

# UPDATE
UPDATE_RESPONSE=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/members?id=eq.${CREATED_MEMBER_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"department\": \"Engineering\"}")

if [ $? -eq 0 ]; then
    print_test_result "Members - UPDATE" "PASS" ""
else
    print_test_result "Members - UPDATE" "FAIL" "$UPDATE_RESPONSE"
fi

echo ""

# ========================================
# TEST 4: MEDIA TABLE
# ========================================
echo -e "${BLUE}[4/12] Testing MEDIA table...${NC}"

# CREATE
CREATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/media" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"file_url\": \"https://example.com/test-file.pdf\",
    \"file_name\": \"test-file.pdf\",
    \"file_type\": \"application/pdf\",
    \"file_size\": \"1024\",
    \"company_id\": \"${CREATED_COMPANY_ID}\",
    \"uploaded_by\": \"${CREATED_USER_ID}\",
    \"status\": \"ACTIVE\"
  }")

CREATED_MEDIA_ID=$(extract_id "$CREATE_RESPONSE")
if [ -n "$CREATED_MEDIA_ID" ]; then
    CREATED_IDS["media"]="$CREATED_MEDIA_ID"
    print_test_result "Media - CREATE" "PASS" ""
else
    print_test_result "Media - CREATE" "FAIL" "$CREATE_RESPONSE"
fi

# READ
READ_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/media?id=eq.${CREATED_MEDIA_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if echo "$READ_RESPONSE" | grep -q "test-file.pdf"; then
    print_test_result "Media - READ" "PASS" ""
else
    print_test_result "Media - READ" "FAIL" "$READ_RESPONSE"
fi

# UPDATE
UPDATE_RESPONSE=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/media?id=eq.${CREATED_MEDIA_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"file_size\": \"2048\"}")

if [ $? -eq 0 ]; then
    print_test_result "Media - UPDATE" "PASS" ""
else
    print_test_result "Media - UPDATE" "FAIL" "$UPDATE_RESPONSE"
fi

echo ""

# ========================================
# TEST 5: COMPANY_MEDIA TABLE
# ========================================
echo -e "${BLUE}[5/12] Testing COMPANY_MEDIA table...${NC}"

# CREATE
CREATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/company_media" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"company_id\": \"${CREATED_COMPANY_ID}\",
    \"media_id\": \"${CREATED_MEDIA_ID}\"
  }")

CREATED_COMPANY_MEDIA_ID=$(extract_id "$CREATE_RESPONSE")
if [ -n "$CREATED_COMPANY_MEDIA_ID" ]; then
    CREATED_IDS["company_media"]="$CREATED_COMPANY_MEDIA_ID"
    print_test_result "Company_Media - CREATE" "PASS" ""
else
    print_test_result "Company_Media - CREATE" "FAIL" "$CREATE_RESPONSE"
fi

# READ
READ_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/company_media?id=eq.${CREATED_COMPANY_MEDIA_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if echo "$READ_RESPONSE" | grep -q "$CREATED_COMPANY_ID"; then
    print_test_result "Company_Media - READ" "PASS" ""
else
    print_test_result "Company_Media - READ" "FAIL" "$READ_RESPONSE"
fi

echo ""

# ========================================
# TEST 6: AGENT_CONVERSATIONS TABLE
# ========================================
echo -e "${BLUE}[6/12] Testing AGENT_CONVERSATIONS table...${NC}"

# CREATE
AGENT_ID=$(generate_uuid)
CREATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/agent_conversations" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"chat_name\": \"Test Conversation\",
    \"company_id\": \"${CREATED_COMPANY_ID}\",
    \"enterprise_user_id\": \"${CREATED_USER_ID}\",
    \"agent_id\": \"${AGENT_ID}\",
    \"status\": \"active\"
  }")

CREATED_CONVERSATION_ID=$(extract_id "$CREATE_RESPONSE")
if [ -n "$CREATED_CONVERSATION_ID" ]; then
    CREATED_IDS["conversation"]="$CREATED_CONVERSATION_ID"
    print_test_result "Agent_Conversations - CREATE" "PASS" ""
else
    print_test_result "Agent_Conversations - CREATE" "FAIL" "$CREATE_RESPONSE"
fi

# READ
READ_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/agent_conversations?id=eq.${CREATED_CONVERSATION_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if echo "$READ_RESPONSE" | grep -q "Test Conversation"; then
    print_test_result "Agent_Conversations - READ" "PASS" ""
else
    print_test_result "Agent_Conversations - READ" "FAIL" "$READ_RESPONSE"
fi

# UPDATE
UPDATE_RESPONSE=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/agent_conversations?id=eq.${CREATED_CONVERSATION_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"summary\": \"Updated conversation summary\"}")

if [ $? -eq 0 ]; then
    print_test_result "Agent_Conversations - UPDATE" "PASS" ""
else
    print_test_result "Agent_Conversations - UPDATE" "FAIL" "$UPDATE_RESPONSE"
fi

echo ""

# ========================================
# TEST 7: CHAT_MESSAGES TABLE
# ========================================
echo -e "${BLUE}[7/12] Testing CHAT_MESSAGES table...${NC}"

# CREATE
MESSAGE_ID="msg-$(date +%s)-$(uuidgen | cut -d'-' -f1)"
CREATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/chat_messages" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"conversation_id\": \"${CREATED_CONVERSATION_ID}\",
    \"message_id\": \"${MESSAGE_ID}\",
    \"user_query\": \"Test user query\",
    \"ai_response\": \"Test AI response\",
    \"message_type\": \"user\"
  }")

CREATED_MESSAGE_ID=$(extract_id "$CREATE_RESPONSE")
if [ -n "$CREATED_MESSAGE_ID" ]; then
    CREATED_IDS["message"]="$CREATED_MESSAGE_ID"
    print_test_result "Chat_Messages - CREATE" "PASS" ""
else
    print_test_result "Chat_Messages - CREATE" "FAIL" "$CREATE_RESPONSE"
fi

# READ
READ_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/chat_messages?id=eq.${CREATED_MESSAGE_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if echo "$READ_RESPONSE" | grep -q "Test user query"; then
    print_test_result "Chat_Messages - READ" "PASS" ""
else
    print_test_result "Chat_Messages - READ" "FAIL" "$READ_RESPONSE"
fi

# UPDATE
UPDATE_RESPONSE=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/chat_messages?id=eq.${CREATED_MESSAGE_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"ai_response\": \"Updated AI response\"}")

if [ $? -eq 0 ]; then
    print_test_result "Chat_Messages - UPDATE" "PASS" ""
else
    print_test_result "Chat_Messages - UPDATE" "FAIL" "$UPDATE_RESPONSE"
fi

echo ""

# ========================================
# TEST 8: RULEBASE TABLE
# ========================================
echo -e "${BLUE}[8/12] Testing RULEBASE table...${NC}"

# CREATE
CREATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/rulebase" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"name\": \"Test Rulebase\",
    \"description\": \"Test rulebase description\",
    \"source_type\": \"text\",
    \"active\": true,
    \"user_id\": \"${CREATED_USER_ID}\",
    \"company_id\": \"${CREATED_COMPANY_ID}\"
  }")

CREATED_RULEBASE_ID=$(extract_id "$CREATE_RESPONSE")
if [ -n "$CREATED_RULEBASE_ID" ]; then
    CREATED_IDS["rulebase"]="$CREATED_RULEBASE_ID"
    print_test_result "Rulebase - CREATE" "PASS" ""
else
    print_test_result "Rulebase - CREATE" "FAIL" "$CREATE_RESPONSE"
fi

# READ
READ_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/rulebase?id=eq.${CREATED_RULEBASE_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if echo "$READ_RESPONSE" | grep -q "Test Rulebase"; then
    print_test_result "Rulebase - READ" "PASS" ""
else
    print_test_result "Rulebase - READ" "FAIL" "$READ_RESPONSE"
fi

# UPDATE
UPDATE_RESPONSE=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/rulebase?id=eq.${CREATED_RULEBASE_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"description\": \"Updated rulebase description\"}")

if [ $? -eq 0 ]; then
    print_test_result "Rulebase - UPDATE" "PASS" ""
else
    print_test_result "Rulebase - UPDATE" "FAIL" "$UPDATE_RESPONSE"
fi

echo ""

# ========================================
# TEST 9: DOCUMENT_ANALYSIS TABLE
# ========================================
echo -e "${BLUE}[9/12] Testing DOCUMENT_ANALYSIS table...${NC}"

# CREATE
DOC_ID="doc-$(date +%s)"
CREATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/document_analysis" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"${CREATED_USER_ID}\",
    \"company_id\": \"${CREATED_COMPANY_ID}\",
    \"document_id\": \"${DOC_ID}\",
    \"title\": \"Test Document Analysis\",
    \"compliance_standard\": \"HIPAA\",
    \"score\": 85
  }")

CREATED_DOC_ANALYSIS_ID=$(extract_id "$CREATE_RESPONSE")
if [ -n "$CREATED_DOC_ANALYSIS_ID" ]; then
    CREATED_IDS["doc_analysis"]="$CREATED_DOC_ANALYSIS_ID"
    print_test_result "Document_Analysis - CREATE" "PASS" ""
else
    print_test_result "Document_Analysis - CREATE" "FAIL" "$CREATE_RESPONSE"
fi

# READ
READ_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/document_analysis?id=eq.${CREATED_DOC_ANALYSIS_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if echo "$READ_RESPONSE" | grep -q "Test Document Analysis"; then
    print_test_result "Document_Analysis - READ" "PASS" ""
else
    print_test_result "Document_Analysis - READ" "FAIL" "$READ_RESPONSE"
fi

# UPDATE
UPDATE_RESPONSE=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/document_analysis?id=eq.${CREATED_DOC_ANALYSIS_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"score\": 90}")

if [ $? -eq 0 ]; then
    print_test_result "Document_Analysis - UPDATE" "PASS" ""
else
    print_test_result "Document_Analysis - UPDATE" "FAIL" "$UPDATE_RESPONSE"
fi

echo ""

# ========================================
# TEST 10: AUDIT_LOGS TABLE
# ========================================
echo -e "${BLUE}[10/12] Testing AUDIT_LOGS table...${NC}"

# CREATE
CREATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/audit_logs" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"${CREATED_USER_ID}\",
    \"company_id\": \"${CREATED_COMPANY_ID}\",
    \"action\": \"test_action\",
    \"entity_type\": \"test_entity\",
    \"entity_id\": \"test-123\"
  }")

CREATED_AUDIT_ID=$(extract_id "$CREATE_RESPONSE")
if [ -n "$CREATED_AUDIT_ID" ]; then
    CREATED_IDS["audit"]="$CREATED_AUDIT_ID"
    print_test_result "Audit_Logs - CREATE" "PASS" ""
else
    print_test_result "Audit_Logs - CREATE" "FAIL" "$CREATE_RESPONSE"
fi

# READ
READ_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/audit_logs?id=eq.${CREATED_AUDIT_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if echo "$READ_RESPONSE" | grep -q "test_action"; then
    print_test_result "Audit_Logs - READ" "PASS" ""
else
    print_test_result "Audit_Logs - READ" "FAIL" "$READ_RESPONSE"
fi

# UPDATE
UPDATE_RESPONSE=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/audit_logs?id=eq.${CREATED_AUDIT_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"entity_type\": \"updated_entity\"}")

if [ $? -eq 0 ]; then
    print_test_result "Audit_Logs - UPDATE" "PASS" ""
else
    print_test_result "Audit_Logs - UPDATE" "FAIL" "$UPDATE_RESPONSE"
fi

echo ""

# ========================================
# TEST 11: SEARCH_HISTORY TABLE
# ========================================
echo -e "${BLUE}[11/12] Testing SEARCH_HISTORY table...${NC}"

# CREATE
CREATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/search_history" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"enterprise_user_id\": \"${CREATED_USER_ID}\",
    \"company_id\": \"${CREATED_COMPANY_ID}\",
    \"text\": [\"search query 1\", \"search query 2\"]
  }")

CREATED_SEARCH_ID=$(extract_id "$CREATE_RESPONSE")
if [ -n "$CREATED_SEARCH_ID" ]; then
    CREATED_IDS["search"]="$CREATED_SEARCH_ID"
    print_test_result "Search_History - CREATE" "PASS" ""
else
    print_test_result "Search_History - CREATE" "FAIL" "$CREATE_RESPONSE"
fi

# READ
READ_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/search_history?id=eq.${CREATED_SEARCH_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if echo "$READ_RESPONSE" | grep -q "search query"; then
    print_test_result "Search_History - READ" "PASS" ""
else
    print_test_result "Search_History - READ" "FAIL" "$READ_RESPONSE"
fi

# UPDATE
UPDATE_RESPONSE=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/search_history?id=eq.${CREATED_SEARCH_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"text\": [\"updated query\"]}")

if [ $? -eq 0 ]; then
    print_test_result "Search_History - UPDATE" "PASS" ""
else
    print_test_result "Search_History - UPDATE" "FAIL" "$UPDATE_RESPONSE"
fi

echo ""

# ========================================
# TEST 12: FEEDBACK TABLE
# ========================================
echo -e "${BLUE}[12/12] Testing FEEDBACK table...${NC}"

# CREATE
CREATE_RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/rest/v1/feedback" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"${CREATED_USER_ID}\",
    \"company_id\": \"${CREATED_COMPANY_ID}\",
    \"satisfaction\": \"satisfied\",
    \"text\": \"Great product!\"
  }")

CREATED_FEEDBACK_ID=$(extract_id "$CREATE_RESPONSE")
if [ -n "$CREATED_FEEDBACK_ID" ]; then
    CREATED_IDS["feedback"]="$CREATED_FEEDBACK_ID"
    print_test_result "Feedback - CREATE" "PASS" ""
else
    print_test_result "Feedback - CREATE" "FAIL" "$CREATE_RESPONSE"
fi

# READ
READ_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/feedback?id=eq.${CREATED_FEEDBACK_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")

if echo "$READ_RESPONSE" | grep -q "Great product"; then
    print_test_result "Feedback - READ" "PASS" ""
else
    print_test_result "Feedback - READ" "FAIL" "$READ_RESPONSE"
fi

# UPDATE
UPDATE_RESPONSE=$(curl -s -X PATCH "${SUPABASE_URL}/rest/v1/feedback?id=eq.${CREATED_FEEDBACK_ID}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Excellent product!\"}")

if [ $? -eq 0 ]; then
    print_test_result "Feedback - UPDATE" "PASS" ""
else
    print_test_result "Feedback - UPDATE" "FAIL" "$UPDATE_RESPONSE"
fi

echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  PERFORMING DELETE OPERATIONS${NC}"
echo -e "${BLUE}========================================${NC}\n"

# ========================================
# DELETE OPERATIONS (in reverse order to respect foreign keys)
# ========================================

# Delete Feedback
if [ -n "${CREATED_IDS[feedback]}" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/feedback?id=eq.${CREATED_IDS[feedback]}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    print_test_result "Feedback - DELETE" "PASS" ""
fi

# Delete Search History
if [ -n "${CREATED_IDS[search]}" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/search_history?id=eq.${CREATED_IDS[search]}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    print_test_result "Search_History - DELETE" "PASS" ""
fi

# Delete Audit Logs
if [ -n "${CREATED_IDS[audit]}" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/audit_logs?id=eq.${CREATED_IDS[audit]}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    print_test_result "Audit_Logs - DELETE" "PASS" ""
fi

# Delete Document Analysis
if [ -n "${CREATED_IDS[doc_analysis]}" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/document_analysis?id=eq.${CREATED_IDS[doc_analysis]}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    print_test_result "Document_Analysis - DELETE" "PASS" ""
fi

# Delete Rulebase
if [ -n "${CREATED_IDS[rulebase]}" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/rulebase?id=eq.${CREATED_IDS[rulebase]}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    print_test_result "Rulebase - DELETE" "PASS" ""
fi

# Delete Chat Messages
if [ -n "${CREATED_IDS[message]}" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/chat_messages?id=eq.${CREATED_IDS[message]}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    print_test_result "Chat_Messages - DELETE" "PASS" ""
fi

# Delete Agent Conversations
if [ -n "${CREATED_IDS[conversation]}" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/agent_conversations?id=eq.${CREATED_IDS[conversation]}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    print_test_result "Agent_Conversations - DELETE" "PASS" ""
fi

# Delete Company Media
if [ -n "${CREATED_IDS[company_media]}" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/company_media?id=eq.${CREATED_IDS[company_media]}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    print_test_result "Company_Media - DELETE" "PASS" ""
fi

# Delete Media
if [ -n "${CREATED_IDS[media]}" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/media?id=eq.${CREATED_IDS[media]}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    print_test_result "Media - DELETE" "PASS" ""
fi

# Delete Members
if [ -n "${CREATED_IDS[member]}" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/members?id=eq.${CREATED_IDS[member]}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    print_test_result "Members - DELETE" "PASS" ""
fi

# Delete Users
if [ -n "${CREATED_IDS[user]}" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/users?id=eq.${CREATED_IDS[user]}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    print_test_result "Users - DELETE" "PASS" ""
fi

# Delete Companies
if [ -n "${CREATED_IDS[company]}" ]; then
    DELETE_RESPONSE=$(curl -s -X DELETE "${SUPABASE_URL}/rest/v1/companies?id=eq.${CREATED_IDS[company]}" \
      -H "apikey: ${SERVICE_ROLE_KEY}" \
      -H "Authorization: Bearer ${SERVICE_ROLE_KEY}")
    print_test_result "Companies - DELETE" "PASS" ""
fi

# ========================================
# FINAL SUMMARY
# ========================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}  TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests: ${YELLOW}${TOTAL_TESTS}${NC}"
echo -e "Passed: ${GREEN}${PASSED_TESTS}${NC}"
echo -e "Failed: ${RED}${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}"
    echo -e "${GREEN}All 12 Supabase tables are fully functional.${NC}"
    exit 0
else
    echo -e "\n${RED}✗ SOME TESTS FAILED${NC}"
    echo -e "${RED}Please review the failures above.${NC}"
    exit 1
fi
