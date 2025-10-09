# 🚀 Supabase Migration - Quick Start Guide

## Status: Ready to Execute ✅

All preparatory work is complete. This guide will help you execute the migration in **10 minutes**.

---

## 📋 What's Been Done

✅ **Created Git Branch**: `dev-anuj`  
✅ **Installed Dependencies**: `@supabase/supabase-js`, `@supabase/ssr`  
✅ **Created Supabase Client Utilities**: Browser & Server clients  
✅ **Generated Migration SQL**: Complete schema with 12 tables  
✅ **Updated Environment Variables**: Added Supabase credentials  

---

## 🎯 What You Need To Do

### Step 1: Copy Environment Variables (1 minute)

Create `.env.local` file in the project root and add:

```bash
# Copy from .env.example or use these directly:
NEXT_PUBLIC_SUPABASE_URL=https://ovnnsldnefxwypkclbjc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bm5zbGRuZWZ4d3lwa2NsYmpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3Nzc1MTMsImV4cCI6MjA3NDM1MzUxM30.IKDbB6CGMSGTjMiH_gWtubjNSAdu1cgwb4-H8_iDl2Y
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92bm5zbGRuZWZ4d3lwa2NsYmpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODc3NzUxMywiZXhwIjoyMDc0MzUzNTEzfQ._ZAu02KzFs-Ad3CxAE1o7GYq0xWazGvAnVkfuo17C7A
DATABASE_URL=postgresql://postgres:rwe2EUX9zpx_wqj!hem@db.ovnnsldnefxwypkclbjc.supabase.co:5432/postgres?sslmode=require
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Keep MongoDB vars for now (rollback safety)
MONGODB_URI=<your-current-mongodb-uri>
DB_NAME=poligap
```

### Step 2: Run the Schema Migration (2 minutes)

**Option A: Using Supabase Dashboard (Recommended)**

1. Open: https://ovnnsldnefxwypkclbjc.supabase.co/project/ovnnsldnefxwypkclbjc/sql
2. Open the file: `supabase/migrations/001_initial_schema.sql`
3. Copy ALL contents
4. Paste into the SQL Editor
5. Click **"Run"**
6. Wait for success message

**Option B: Using Supabase MCP (if available)**

```bash
# The MCP should auto-detect and run migrations
# Check in Supabase dashboard if tables were created
```

**Option C: Using pg (PostgreSQL client)**

```bash
# Install pg if needed
npm install pg

# Run migration
PGPASSWORD='rwe2EUX9zpx_wqj!hem' psql -h db.ovnnsldnefxwypkclbjc.supabase.co -p 5432 -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
```

### Step 3: Verify Tables Were Created (1 minute)

Run this verification script:

```bash
# Create quick verification
cat > verify-schema.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verify() {
  const tables = [
    'companies', 'users', 'members', 'media', 'company_media',
    'agent_conversations', 'chat_messages', 'rulebase',
    'document_analysis', 'audit_logs', 'search_history', 'feedback'
  ];

  console.log('🔍 Verifying Supabase schema...\n');

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${table}: ERROR - ${error.message}`);
    } else {
      console.log(`✅ ${table}: Found (${count || 0} records)`);
    }
  }
}

verify();
EOF

# Run verification
node verify-schema.js
```

### Step 4: Test Supabase Connection (1 minute)

```bash
# Test the setup
cat > test-supabase.js << 'EOF'
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  console.log('🧪 Testing Supabase connection...\n');

  // Test INSERT
  const { data: company, error: insertError } = await supabase
    .from('companies')
    .insert({
      company_id: '00000000-0000-0000-0000-000000000001',
      name: 'Test Company'
    })
    .select()
    .single();

  if (insertError) {
    console.log('❌ INSERT failed:', insertError.message);
    return;
  }

  console.log('✅ INSERT successful:', company.name);

  // Test SELECT
  const { data: companies, error: selectError } = await supabase
    .from('companies')
    .select('*')
    .limit(5);

  if (selectError) {
    console.log('❌ SELECT failed:', selectError.message);
    return;
  }

  console.log(`✅ SELECT successful: Found ${companies.length} companies`);

  // Test DELETE (cleanup)
  const { error: deleteError } = await supabase
    .from('companies')
    .delete()
    .eq('company_id', '00000000-0000-0000-0000-000000000001');

  if (deleteError) {
    console.log('❌ DELETE failed:', deleteError.message);
    return;
  }

  console.log('✅ DELETE successful');
  console.log('\n🎉 All basic CRUD operations working!\n');
}

test();
EOF

node test-supabase.js
```

---

## 📝 Next Steps After Verification

Once tables are confirmed:

### 1. Create Dynamic CRUD Test Suite (like kroolo-bsm)

```bash
# I'll create this for you based on the kroolo-bsm pattern
# It will test all 12 tables with auto-cleanup
```

### 2. Migrate API Routes

Start migrating MongoDB calls to Supabase:

**Before (MongoDB)**:
```typescript
import UserModel from '@/models/users.model';

const user = await UserModel.findOne({ email });
```

**After (Supabase)**:
```typescript
import { createClient } from '@/lib/supabase/server';

const supabase = await createClient();
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('email', email)
  .single();
```

### 3. Setup GraphQL (Optional)

GraphQL is auto-enabled on your Supabase project:
- Endpoint: `https://ovnnsldnefxwypkclbjc.supabase.co/graphql/v1`
- GraphiQL IDE: Available in Supabase Dashboard → API → GraphQL

---

## 🛠️ Files Created

```
✅ src/lib/supabase/client.ts          # Browser Supabase client
✅ src/lib/supabase/server.ts          # Server Supabase client (with service role)
✅ supabase/migrations/001_initial_schema.sql  # Complete schema migration
✅ scripts/init-schema-direct.js       # Schema verification script
✅ MIGRATION_GUIDE.md                  # Detailed 3-phase migration guide
✅ WARP.md                            # Project documentation for AI
✅ .env.example                       # Updated with Supabase vars
```

---

## 🔥 Quick Command Summary

```bash
# 1. Setup environment
cp .env.example .env.local
# Edit .env.local with your values

# 2. Run schema migration (choose one method from Step 2 above)

# 3. Verify setup
node verify-schema.js

# 4. Test CRUD
node test-supabase.js

# 5. Commit changes
git add -A
git commit -m "feat: Add Supabase migration setup and utilities"
git push origin dev-anuj
```

---

## 📊 Database Schema Overview

**12 Tables Created:**

1. **companies** - Organization/company data
2. **users** - User profiles with extensive metadata
3. **members** - User-company junction (many-to-many)
4. **media** - File uploads and documents
5. **company_media** - Company-media relationships
6. **agent_conversations** - AI chat sessions
7. **chat_messages** - Individual chat messages with AI responses
8. **rulebase** - Custom compliance rules and policies
9. **document_analysis** - Compliance analysis results
10. **audit_logs** - Activity tracking and audit trail
11. **search_history** - User search tracking
12. **feedback** - User feedback collection

**Features:**
- ✅ UUID primary keys
- ✅ Foreign key relationships
- ✅ Indexes for performance
- ✅ Auto-updating timestamps (triggers)
- ✅ JSONB support for flexible data
- ✅ Array support for tags, images, etc.
- ✅ Row Level Security (RLS) enabled
- ✅ Check constraints for data integrity

---

## 🚨 Important Notes

1. **MongoDB is NOT removed yet** - This is intentional for safety
2. **Dual operation possible** - You can query both DBs during migration
3. **RLS is enabled** - Use service role key for admin operations
4. **GraphQL is auto-generated** - No configuration needed
5. **Rollback is easy** - Just switch back to MongoDB queries

---

## 🆘 Troubleshooting

### Problem: Tables not showing in Supabase
**Solution**: Make sure you ran the SQL in the correct project (ovnnsldnefxwypkclbjc)

### Problem: Permission denied errors
**Solution**: Use `SUPABASE_SERVICE_ROLE_KEY` instead of `ANON_KEY` for admin operations

### Problem: Connection timeout
**Solution**: Check if database is paused in Supabase dashboard (Settings → Database)

### Problem: Foreign key violations
**Solution**: Tables must be created in order (companies → users → members, etc.)

---

## ✅ Success Criteria

You'll know the setup is complete when:

1. ✅ All 12 tables visible in Supabase Table Editor
2. ✅ `verify-schema.js` shows all tables ✅
3. ✅ `test-supabase.js` completes all CRUD operations
4. ✅ No errors in console when running tests

---

## 📞 Next Actions

After completing this quickstart:

1. Run the dynamic CRUD test suite (I'll create this)
2. Start migrating API routes one by one
3. Update authentication to use Supabase Auth
4. Test frontend with Supabase data
5. Gradually remove MongoDB dependencies

Let me know when Step 1-4 are complete, and I'll help with the next phase!

---

**Estimated Time**: 5-10 minutes  
**Difficulty**: Easy (copy-paste operations)  
**Reversible**: Yes (MongoDB still active)  
**Breaking Changes**: None (MongoDB still works)

🚀 **Let's get started!**
