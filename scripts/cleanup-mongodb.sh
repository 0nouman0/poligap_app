#!/bin/bash

# Supabase Migration Cleanup Script
# This script removes all MongoDB-related code and debug files

echo "🧹 Starting cleanup of MongoDB code and debug files..."

# Remove old MongoDB-based API routes
echo "📁 Removing old MongoDB API routes..."
rm -f src/app/api/users/signin/route.ts
rm -f src/app/api/users/signup/route.ts
rm -f src/app/api/users/signout/route.ts
rm -f src/app/api/users/profile-fallback/route.ts
rm -f src/app/api/users/profile-simple/route.ts
rm -f src/app/api/ensure-user/route.ts

# Remove all Mongoose models
echo "🗂️  Removing Mongoose models..."
rm -rf src/models/

# Remove MongoDB utilities
echo "🔧 Removing MongoDB utilities..."
rm -f src/lib/mongodb.ts
rm -rf src/lib/db/

# Remove debug and fix scripts
echo "🐛 Removing debug and fix scripts..."
rm -f *.js
rm -f fix-*.js
rm -f debug-*.js
rm -f test-*.js
rm -f emergency-*.js
rm -f complete-*.js
rm -f final-*.js
rm -f clear-cache.js
rm -f get-*.js
rm -f no-database-fix.js

# Remove debug/test routes
echo "🧪 Removing debug and test routes..."
rm -rf src/app/debug-theme/
rm -rf src/app/debug-user/
rm -rf src/app/final-chat-test/
rm -rf src/app/fix-chat/
rm -rf src/app/fix-user/
rm -rf src/app/quick-fix/
rm -rf src/app/test-atlas/
rm -rf src/app/test-chat-history/
rm -rf src/app/test-theme/
rm -rf src/app/(app)/fix-profile-data/
rm -rf src/app/(app)/test-profile/
rm -rf src/app/(app)/dashboardstatic/
rm -rf src/app/api/debug/
rm -rf src/app/api/debug-db/
rm -rf src/app/api/debug-user/
rm -rf src/app/api/test-db/
rm -rf src/app/api/test-file-upload/
rm -rf src/app/api/create-test-user/
rm -rf src/app/api/check-users/

# Remove old API client if it's MongoDB-specific
echo "🔌 Checking API client..."
if grep -q "mongodb\|mongoose" src/lib/api-client.ts 2>/dev/null; then
    echo "Found MongoDB references in api-client.ts - manual review needed"
fi

# Remove rulebase.json if using Supabase rulebase table
echo "📋 Checking rulebase..."
if [ -f "data/rulebase.json" ]; then
    echo "Found data/rulebase.json - consider migrating to Supabase rulebase table"
fi

echo "✅ Cleanup complete!"
echo ""
echo "📝 Manual steps remaining:"
echo "1. Update /api/compliance-analysis to use Gemini only"
echo "2. Update /api/contract-analyze to use Gemini only"
echo "3. Migrate /api/ai-chat/* endpoints to Supabase"
echo "4. Migrate /api/rulebase/* endpoints to Supabase"
echo "5. Migrate /api/tasks/* endpoints to Supabase"
echo "6. Migrate /api/audit-logs/* endpoints to Supabase"
echo "7. Update frontend stores and queries"
echo "8. Run npm install to clean up package-lock.json"
echo "9. Test all features"
