#!/bin/bash

# Batch script to add RBAC to all unprotected routes
# This will add requireAuth() to all GET/POST/PUT/PATCH/DELETE handlers

echo "🔒 Batch Adding RBAC to Unprotected Routes..."

# List of files to process (excluding auth routes which already have rate limiting)
FILES=(
"src/app/api/pd/route.ts"
"src/app/api/email-notifier/send/route.ts"
"src/app/api/extract-simple/route.ts"
"src/app/api/s3/upload/route.ts"
"src/app/api/policy-generator/generate/route.ts"
"src/app/api/extract-document/route.ts"
"src/app/api/parse-document/route.ts"
"src/app/api/chat-history/save-batch/route.ts"
"src/app/api/chat-history/save-message/route.ts"
"src/app/api/contract-analyze/route.ts"
"src/app/api/health/mongodb/route.ts"
"src/app/api/pipedream/accessToken/route.ts"
"src/app/api/idea-analyzer/analyze/route.ts"
"src/app/api/check-users/route.ts"
"src/app/api/all-chat-history/inbox/route.ts"
"src/app/api/all-chat-history/trash/route.ts"
"src/app/api/search/route.ts"
"src/app/api/ai-chat/generate-title/route.ts"
"src/app/api/ai-chat/edit-conversation/route.ts"
"src/app/api/extract-text/route.ts"
"src/app/api/rulebase/upload/route.ts"
"src/app/api/template-audit-logs/route.ts"
"src/app/api/knowledge-base/enable/route.ts"
"src/app/api/knowledge-base/train-card/route.ts"
"src/app/api/knowledge-base/upload-media/route.ts"
"src/app/api/knowledge-base/overview/route.ts"
"src/app/api/users/user-details/route.ts"
"src/app/api/users/profile-simple/route.ts"
"src/app/api/users/profile-fallback/route.ts"
"src/app/api/users/get-member/route.ts"
"src/app/api/users/get-user/route.ts"
"src/app/api/ensure-user/route.ts"
"src/app/api/export-pdf/route.ts"
"src/app/api/law-scanner/query/route.ts"
"src/app/api/log/route.ts"
"src/app/api/extract-pdf/route.ts"
"src/app/api/compliance-analysis/route.ts"
"src/app/api/assets/resolve/route.ts"
"src/app/api/analytics/searches/top/route.ts"
"src/app/api/analytics/searches/series/route.ts"
"src/app/api/analytics/dashboard/route.ts"
"src/app/api/extract-basic/route.ts"
"src/app/api/company/members/member-details/route.ts"
"src/app/api/flagged-issues/route.ts"
)

count=0

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    count=$((count + 1))
  fi
done

echo ""
echo "✅ Found $count files to process"
echo ""
echo "Note: This is a dry run. Use the Node.js script for actual processing."
