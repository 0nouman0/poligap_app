# MongoDB to Supabase Migration Guide - Poligap AI

**Project**: Poligap AI Legal Compliance Platform  
**Migration Type**: MongoDB → Supabase (PostgreSQL + Auth + GraphQL)  
**Strategy**: Zero-Downtime, 3-Phase Approach  
**Timeline**: 3 Phases (not days - sequential steps)

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: Supabase Setup & Database Migration](#phase-1-supabase-setup--database-migration)
3. [Phase 2: Client Migration & Supabase Auth](#phase-2-client-migration--supabase-auth)
4. [Phase 3: GraphQL Integration & Cleanup](#phase-3-graphql-integration--cleanup)
5. [Rollback Strategy](#rollback-strategy)
6. [Testing Checklist](#testing-checklist)

---

## Prerequisites

### Required Credentials (Already Provided)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ovnnsldnefxwypkclbjc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:rwe2EUX9zpx_wqj!hem@db.uzbozldsdzsfytsteqlb.supabase.co:5432/postgres?sslmode=require
SUPABASE_DB_PASSWORD=rwe2EUX9zpx_wqj!hem
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Before Starting

1. **Backup MongoDB Data**
   ```bash
   # Create full backup
   mongodump --uri="$MONGODB_URI" --out=./mongodb-backup-$(date +%Y%m%d)
   ```

2. **Install Dependencies**
   ```bash
   npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
   npm install --save-dev @supabase/cli
   ```

3. **Create Git Branch**
   ```bash
   git checkout -b migration/mongodb-to-supabase
   ```

---

## Phase 1: Supabase Setup & Database Migration

### Step 1.1: Initialize Supabase Schema

**Duration**: 30-45 minutes  
**Risk Level**: Low (no existing data affected)

1. **Run the initial migration script**

```bash
# Login to Supabase CLI
npx supabase login

# Link to your project
npx supabase link --project-ref ovnnsldnefxwypkclbjc

# Run the migration
npx supabase db push --db-url "$DATABASE_URL"
```

Alternatively, run the SQL directly in Supabase Dashboard:
- Go to: https://ovnnsldnefxwypkclbjc.supabase.co/project/ovnnsldnefxwypkclbjc/sql
- Copy and paste `/supabase/migrations/001_initial_schema.sql`
- Click "Run"

2. **Verify Schema Creation**

```bash
# Check tables were created
npx supabase db diff --db-url "$DATABASE_URL"
```

Or use the Supabase Dashboard:
- Navigate to Table Editor
- Confirm all 12 tables exist:
  - companies
  - users
  - members
  - media
  - company_media
  - agent_conversations
  - chat_messages
  - rulebase
  - document_analysis
  - audit_logs
  - search_history
  - feedback

### Step 1.2: Data Migration Script

Create `scripts/migrate-data-to-supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';
import UserModel from '@/models/users.model';
import CompanyModel from '@/models/companies.model';
import MembersModel from '@/models/members.model';
import ChatMessageModel from '@/models/chatMessage.model';
import AgentConversationModel from '@/models/agentConversation.model';
import RulebaseModel from '@/models/rulebase.model';
import DocumentAnalysisModel from '@/models/documentAnalysis.model';
import AuditLogModel from '@/models/auditLog.model';
import MediaModel from '@/models/media.model';
import SearchHistoryModel from '@/models/searchHistory.model';
import FeedbackModel from '@/models/feedback.model';

// Initialize Supabase Admin Client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// MongoDB ObjectId to UUID mapping
const idMap = new Map<string, string>();

function generateUUID(): string {
  return crypto.randomUUID();
}

function mapMongoIdToUUID(mongoId: string): string {
  if (!idMap.has(mongoId)) {
    idMap.set(mongoId, generateUUID());
  }
  return idMap.get(mongoId)!;
}

async function migrateCompanies() {
  console.log('🏢 Migrating companies...');
  const companies = await CompanyModel.find({}).lean();
  
  const mappedCompanies = companies.map(company => ({
    id: mapMongoIdToUUID(company._id.toString()),
    company_id: mapMongoIdToUUID(company.companyId.toString()),
    name: company.name,
    enable_knowledge_base: company.enableKnowledgeBase || false,
    created_at: company.createdAt,
    updated_at: company.updatedAt
  }));

  const { data, error } = await supabase
    .from('companies')
    .upsert(mappedCompanies, { onConflict: 'id' });

  if (error) throw error;
  console.log(`✅ Migrated ${mappedCompanies.length} companies`);
  return mappedCompanies;
}

async function migrateUsers() {
  console.log('👤 Migrating users...');
  const users = await UserModel.find({}).lean();
  
  const mappedUsers = users.map(user => ({
    id: mapMongoIdToUUID(user._id.toString()),
    user_id: mapMongoIdToUUID(user.userId.toString()),
    unique_id: user.uniqueId,
    email: user.email,
    name: user.name,
    status: user.status || 'ACTIVE',
    country: user.country,
    dob: user.dob,
    mobile: user.mobile,
    profile_image: user.profileImage,
    profile_created_on: user.profileCreatedOn,
    about: user.about,
    banner_image: user.banner?.image,
    banner_color: user.banner?.color,
    banner_type: user.banner?.type,
    banner_y_offset: user.banner?.yOffset,
    designation: user.designation,
    role: user.role,
    member_status: user.memberStatus,
    company_name: user.companyName,
    reporting_manager_name: user.reportingManager?.name,
    reporting_manager_email: user.reportingManager?.email,
    created_by_name: user.createdBy?.name,
    created_by_email: user.createdBy?.email,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  }));

  // Batch insert in chunks of 100
  for (let i = 0; i < mappedUsers.length; i += 100) {
    const chunk = mappedUsers.slice(i, i + 100);
    const { error } = await supabase
      .from('users')
      .upsert(chunk, { onConflict: 'id' });
    
    if (error) throw error;
    console.log(`✅ Migrated ${i + chunk.length}/${mappedUsers.length} users`);
  }

  return mappedUsers;
}

async function migrateMembers() {
  console.log('👥 Migrating members...');
  const members = await MembersModel.find({}).lean();
  
  const mappedMembers = members.map(member => ({
    id: mapMongoIdToUUID(member._id.toString()),
    user_id: mapMongoIdToUUID(member.userId.toString()),
    company_id: mapMongoIdToUUID(member.companyId.toString()),
    status: member.status || 'ACTIVE',
    role: member.role || 'user',
    designation: member.designation,
    department: (member as any).department,
    reporting_manager_id: member.reportingManagerId ? mapMongoIdToUUID(member.reportingManagerId.toString()) : null,
    reporting_manager_name: member.reportingManagerName,
    reporting_manager_email: member.reportingManagerEmail,
    created_by: member.createdBy ? mapMongoIdToUUID(member.createdBy.toString()) : null,
    created_by_name: member.createdByName,
    created_by_email: member.createdByEmail,
    created_at: member.createdAt,
    updated_at: member.updatedAt
  }));

  for (let i = 0; i < mappedMembers.length; i += 100) {
    const chunk = mappedMembers.slice(i, i + 100);
    const { error } = await supabase
      .from('members')
      .upsert(chunk, { onConflict: 'id' });
    
    if (error) throw error;
    console.log(`✅ Migrated ${i + chunk.length}/${mappedMembers.length} members`);
  }
}

async function migrateMedia() {
  console.log('📁 Migrating media...');
  const media = await MediaModel.find({}).lean();
  
  const mappedMedia = media.map(m => ({
    id: mapMongoIdToUUID(m._id.toString()),
    file_url: m.fileUrl,
    file_name: m.fileName,
    file_type: m.fileType,
    file_size: m.fileSize,
    company_id: mapMongoIdToUUID(m.companyId.toString()),
    uploaded_by: mapMongoIdToUUID(m.uploadedBy.toString()),
    status: m.status || 'ACTIVE',
    created_at: m.createdAt,
    updated_at: m.updatedAt
  }));

  for (let i = 0; i < mappedMedia.length; i += 100) {
    const chunk = mappedMedia.slice(i, i + 100);
    const { error } = await supabase
      .from('media')
      .upsert(chunk, { onConflict: 'id' });
    
    if (error) throw error;
    console.log(`✅ Migrated ${i + chunk.length}/${mappedMedia.length} media`);
  }
}

async function migrateAgentConversations() {
  console.log('💬 Migrating agent conversations...');
  const conversations = await AgentConversationModel.find({}).lean();
  
  const mapped = conversations.map(conv => ({
    id: mapMongoIdToUUID(conv._id.toString()),
    chat_name: conv.chatName,
    company_id: mapMongoIdToUUID(conv.companyId.toString()),
    enterprise_user_id: mapMongoIdToUUID(conv.enterpriseUserId.toString()),
    agent_id: conv.agentId ? mapMongoIdToUUID(conv.agentId.toString()) : null,
    summary: conv.summary,
    status: conv.status || 'active',
    created_at: conv.createdAt,
    updated_at: conv.updatedAt
  }));

  for (let i = 0; i < mapped.length; i += 100) {
    const chunk = mapped.slice(i, i + 100);
    const { error } = await supabase
      .from('agent_conversations')
      .upsert(chunk, { onConflict: 'id' });
    
    if (error) throw error;
    console.log(`✅ Migrated ${i + chunk.length}/${mapped.length} conversations`);
  }
}

async function migrateChatMessages() {
  console.log('💭 Migrating chat messages...');
  const messages = await ChatMessageModel.find({}).lean();
  
  const mapped = messages.map(msg => ({
    id: mapMongoIdToUUID(msg._id.toString()),
    conversation_id: mapMongoIdToUUID(msg.conversationId.toString()),
    message_id: msg.messageId,
    user_query: msg.userQuery,
    ai_response: msg.aiResponse,
    message_type: msg.messageType,
    tool_calls: msg.toolCalls || [],
    extra_data: msg.extraData || {},
    images: msg.images || [],
    videos: msg.videos || [],
    audio: msg.audio || null,
    response_audio: msg.responseAudio || null,
    streaming_error: msg.streamingError || false,
    created_at: msg.createdAt,
    updated_at: msg.updatedAt
  }));

  for (let i = 0; i < mapped.length; i += 100) {
    const chunk = mapped.slice(i, i + 100);
    const { error } = await supabase
      .from('chat_messages')
      .upsert(chunk, { onConflict: 'message_id' });
    
    if (error) throw error;
    console.log(`✅ Migrated ${i + chunk.length}/${mapped.length} messages`);
  }
}

async function migrateRulebase() {
  console.log('📋 Migrating rulebase...');
  const rules = await RulebaseModel.find({}).lean();
  
  const mapped = rules.map(rule => ({
    id: mapMongoIdToUUID(rule._id.toString()),
    name: rule.name,
    description: rule.description,
    tags: rule.tags || [],
    source_type: rule.sourceType || 'text',
    file_name: rule.fileName,
    file_content: rule.fileContent,
    active: rule.active !== false,
    user_id: rule.userId ? mapMongoIdToUUID(rule.userId.toString()) : null,
    company_id: rule.companyId ? mapMongoIdToUUID(rule.companyId.toString()) : null,
    created_at: rule.createdAt,
    updated_at: rule.updatedAt
  }));

  for (let i = 0; i < mapped.length; i += 100) {
    const chunk = mapped.slice(i, i + 100);
    const { error } = await supabase
      .from('rulebase')
      .upsert(chunk, { onConflict: 'id' });
    
    if (error) throw error;
    console.log(`✅ Migrated ${i + chunk.length}/${mapped.length} rulebases`);
  }
}

async function migrateDocumentAnalysis() {
  console.log('📄 Migrating document analysis...');
  const analyses = await DocumentAnalysisModel.find({}).lean();
  
  const mapped = analyses.map(doc => ({
    id: mapMongoIdToUUID(doc._id.toString()),
    user_id: mapMongoIdToUUID(doc.userId.toString()),
    company_id: mapMongoIdToUUID(doc.companyId.toString()),
    document_id: doc.documentId,
    title: doc.title,
    compliance_standard: doc.complianceStandard,
    score: doc.score,
    metrics: doc.metrics || {},
    created_at: doc.createdAt,
    updated_at: doc.updatedAt
  }));

  for (let i = 0; i < mapped.length; i += 100) {
    const chunk = mapped.slice(i, i + 100);
    const { error } = await supabase
      .from('document_analysis')
      .upsert(chunk, { onConflict: 'id' });
    
    if (error) throw error;
    console.log(`✅ Migrated ${i + chunk.length}/${mapped.length} analyses`);
  }
}

async function migrateAuditLogs() {
  console.log('📊 Migrating audit logs...');
  const logs = await AuditLogModel.find({}).lean();
  
  const mapped = logs.map(log => ({
    id: mapMongoIdToUUID(log._id.toString()),
    user_id: mapMongoIdToUUID(log.userId.toString()),
    company_id: mapMongoIdToUUID(log.companyId.toString()),
    action: log.action,
    entity_type: log.entityType,
    entity_id: log.entityId,
    metadata: log.metadata || {},
    created_at: log.createdAt,
    updated_at: log.updatedAt
  }));

  for (let i = 0; i < mapped.length; i += 100) {
    const chunk = mapped.slice(i, i + 100);
    const { error } = await supabase
      .from('audit_logs')
      .upsert(chunk, { onConflict: 'id' });
    
    if (error) throw error;
    console.log(`✅ Migrated ${i + chunk.length}/${mapped.length} logs`);
  }
}

async function migrateSearchHistory() {
  console.log('🔍 Migrating search history...');
  const searches = await SearchHistoryModel.find({}).lean();
  
  const mapped = searches.map(search => ({
    id: mapMongoIdToUUID(search._id.toString()),
    enterprise_user_id: mapMongoIdToUUID(search.enterpriseUserId.toString()),
    company_id: mapMongoIdToUUID(search.companyId.toString()),
    text: search.text || [],
    created_at: search.createdAt,
    updated_at: search.updatedAt
  }));

  for (let i = 0; i < mapped.length; i += 100) {
    const chunk = mapped.slice(i, i + 100);
    const { error } = await supabase
      .from('search_history')
      .upsert(chunk, { onConflict: 'id' });
    
    if (error) throw error;
    console.log(`✅ Migrated ${i + chunk.length}/${mapped.length} searches`);
  }
}

async function migrateFeedback() {
  console.log('💬 Migrating feedback...');
  const feedbacks = await FeedbackModel.find({}).lean();
  
  const mapped = feedbacks.map(fb => ({
    id: mapMongoIdToUUID(fb._id.toString()),
    user_id: mapMongoIdToUUID(fb.userId.toString()),
    company_id: mapMongoIdToUUID(fb.companyId.toString()),
    satisfaction: fb.satisfaction,
    text: fb.text,
    created_at: fb.createdAt,
    updated_at: fb.updatedAt
  }));

  for (let i = 0; i < mapped.length; i += 100) {
    const chunk = mapped.slice(i, i + 100);
    const { error } = await supabase
      .from('feedback')
      .upsert(chunk, { onConflict: 'id' });
    
    if (error) throw error;
    console.log(`✅ Migrated ${i + chunk.length}/${mapped.length} feedbacks`);
  }
}

async function main() {
  console.log('🚀 Starting MongoDB to Supabase migration...\n');
  
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('✅ Connected to MongoDB\n');

    // Run migrations in order (respecting foreign key constraints)
    await migrateCompanies();
    await migrateUsers();
    await migrateMembers();
    await migrateMedia();
    await migrateAgentConversations();
    await migrateChatMessages();
    await migrateRulebase();
    await migrateDocumentAnalysis();
    await migrateAuditLogs();
    await migrateSearchHistory();
    await migrateFeedback();

    // Save ID mapping for reference
    const mappingFile = `./id-mapping-${Date.now()}.json`;
    const mappingArray = Array.from(idMap.entries()).map(([mongoId, uuid]) => ({ mongoId, uuid }));
    await import('fs/promises').then(fs => 
      fs.writeFile(mappingFile, JSON.stringify(mappingArray, null, 2))
    );
    console.log(`\n💾 ID mapping saved to: ${mappingFile}`);

    console.log('\n✅ Migration completed successfully!');
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

main();
```

Run the migration:
```bash
npx tsx scripts/migrate-data-to-supabase.ts
```

### Step 1.3: Verification

```bash
# Create verification script
npx tsx scripts/verify-migration.ts
```

```typescript
// scripts/verify-migration.ts
import { createClient } from '@supabase/supabase-js';
import mongoose from 'mongoose';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const tables = [
    'companies', 'users', 'members', 'media', 
    'agent_conversations', 'chat_messages', 'rulebase',
    'document_analysis', 'audit_logs', 'search_history', 'feedback'
  ];

  console.log('🔍 Verifying migration...\n');

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`❌ ${table}: ${error.message}`);
    } else {
      console.log(`✅ ${table}: ${count} records`);
    }
  }

  await mongoose.disconnect();
}

verify();
```

**✅ Phase 1 Complete**: Database schema created and data migrated

---

## Phase 2: Client Migration & Supabase Auth

### Step 2.1: Create Supabase Client

Create `src/lib/supabase/client.ts`:

```typescript
import { createBrowserClient } from '@supabase/ssr';

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

Create `src/lib/supabase/server.ts`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle cookie setting errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    }
  );
};
```

Create `src/lib/supabase/middleware.ts`:

```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  await supabase.auth.getUser();

  return response;
}
```

### Step 2.2: Update Middleware

Update `middleware.ts`:

```typescript
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

### Step 2.3: Setup Supabase Auth

1. **Create Auth Pages**

`src/app/auth/sign-in/page.tsx`:

```typescript
'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      router.push('/home');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form onSubmit={handleSignIn} className="space-y-4 w-full max-w-md p-8">
        <h1 className="text-2xl font-bold">Sign In</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-blue-600 text-white rounded"
        >
          {loading ? 'Loading...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
}
```

2. **Update Root Layout**

`src/app/layout.tsx`:

```typescript
import { createClient } from '@/lib/supabase/server';
// ... other imports

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="en" suppressHydrationWarning className={`${Inter.variable} h-full`}>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" sizes="32x32" />
      </head>
      <body className={`${Inter.className} antialiased min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <ThemeProvider>
          <QueryProvider>
            {children}
          </QueryProvider>
          <ToastProvider />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Step 2.4: Create Database Access Layer

Create `src/lib/db/supabase-queries.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';

export async function getUser(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

export async function getCompanyMembers(companyId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('members')
    .select(`
      *,
      user:users(*)
    `)
    .eq('company_id', companyId)
    .eq('status', 'ACTIVE');

  if (error) throw error;
  return data;
}

export async function getChatMessages(conversationId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
}

export async function createChatMessage(message: {
  conversation_id: string;
  message_id: string;
  user_query: string;
  message_type: 'user' | 'ai';
  ai_response?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([message])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Add more query functions as needed
```

### Step 2.5: Update API Routes

Example migration of an API route from MongoDB to Supabase:

**Before (MongoDB)**:
```typescript
// src/app/api/users/[id]/route.ts
import UserModel from '@/models/users.model';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await UserModel.findOne({ userId: params.id });
  return Response.json(user);
}
```

**After (Supabase)**:
```typescript
// src/app/api/users/[id]/route.ts
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('user_id', params.id)
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(user);
}
```

### Step 2.6: Update Environment Variables

Update `.env.local`:

```bash
# Supabase (NEW)
NEXT_PUBLIC_SUPABASE_URL=https://ovnnsldnefxwypkclbjc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:rwe2EUX9zpx_wqj!hem@db.uzbozldsdzsfytsteqlb.supabase.co:5432/postgres?sslmode=require
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# MongoDB (Keep for rollback - comment out when ready to remove)
# MONGODB_URI=mongodb+srv://...
# DB_NAME=poligap
```

**✅ Phase 2 Complete**: Supabase client configured and auth implemented

---

## Phase 3: GraphQL Integration & Cleanup

### Step 3.1: Enable GraphQL in Supabase

1. Go to Supabase Dashboard → Database → API Docs
2. GraphQL is automatically enabled at: `https://ovnnsldnefxwypkclbjc.supabase.co/graphql/v1`

### Step 3.2: Setup GraphQL Client

```bash
npm install graphql @apollo/client
```

Create `src/lib/graphql/client.ts`:

```typescript
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

const httpLink = new HttpLink({
  uri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`,
});

const authLink = setContext(async (_, { headers }) => {
  // Get token from Supabase auth
  const token = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  return {
    headers: {
      ...headers,
      apikey: token,
      authorization: `Bearer ${token}`,
    },
  };
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
```

### Step 3.3: Create GraphQL Queries

Create `src/lib/graphql/queries.ts`:

```typescript
import { gql } from '@apollo/client';

export const GET_USER = gql`
  query GetUser($id: UUID!) {
    usersCollection(filter: { id: { eq: $id } }) {
      edges {
        node {
          id
          email
          name
          profileImage
          status
          createdAt
          updatedAt
        }
      }
    }
  }
`;

export const GET_CHAT_MESSAGES = gql`
  query GetChatMessages($conversationId: UUID!) {
    chatMessagesCollection(
      filter: { conversationId: { eq: $conversationId } }
      orderBy: { createdAt: AscNullsLast }
    ) {
      edges {
        node {
          id
          messageId
          userQuery
          aiResponse
          messageType
          toolCalls
          extraData
          createdAt
        }
      }
    }
  }
`;

export const CREATE_CHAT_MESSAGE = gql`
  mutation CreateChatMessage($input: ChatMessagesInsertInput!) {
    insertIntoChatMessagesCollection(objects: [$input]) {
      records {
        id
        messageId
        userQuery
        createdAt
      }
    }
  }
`;

export const GET_COMPANY_RULEBASES = gql`
  query GetCompanyRulebases($companyId: UUID!) {
    rulebaseCollection(
      filter: { companyId: { eq: $companyId }, active: { eq: true } }
    ) {
      edges {
        node {
          id
          name
          description
          tags
          sourceType
          fileContent
          createdAt
        }
      }
    }
  }
`;
```

### Step 3.4: Use GraphQL in Components

Example usage in a component:

```typescript
'use client';

import { useQuery, useMutation } from '@apollo/client';
import { GET_CHAT_MESSAGES, CREATE_CHAT_MESSAGE } from '@/lib/graphql/queries';

export function ChatComponent({ conversationId }: { conversationId: string }) {
  const { data, loading, error } = useQuery(GET_CHAT_MESSAGES, {
    variables: { conversationId },
  });

  const [createMessage] = useMutation(CREATE_CHAT_MESSAGE);

  const handleSendMessage = async (message: string) => {
    await createMessage({
      variables: {
        input: {
          conversationId,
          messageId: crypto.randomUUID(),
          userQuery: message,
          messageType: 'user',
        },
      },
      refetchQueries: [GET_CHAT_MESSAGES],
    });
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  const messages = data?.chatMessagesCollection?.edges.map((e: any) => e.node) || [];

  return (
    <div>
      {messages.map((msg: any) => (
        <div key={msg.id}>{msg.userQuery}</div>
      ))}
    </div>
  );
}
```

### Step 3.5: Remove MongoDB Dependencies

1. **Remove MongoDB models and connections**:
```bash
rm -rf src/models/
rm -rf src/lib/db/
```

2. **Uninstall MongoDB packages**:
```bash
npm uninstall mongoose mongodb
```

3. **Remove MongoDB environment variables**:
```bash
# Delete from .env.local
MONGODB_URI
DB_NAME
```

4. **Clean up imports** across the codebase:
```bash
# Find and remove MongoDB imports
grep -r "from '@/models" src/ --files-with-matches
grep -r "mongoose" src/ --files-with-matches
```

### Step 3.6: Update package.json Scripts

Add Supabase-related scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "supabase:start": "npx supabase start",
    "supabase:stop": "npx supabase stop",
    "supabase:types": "npx supabase gen types typescript --local > src/types/database.types.ts",
    "migrate:data": "npx tsx scripts/migrate-data-to-supabase.ts",
    "verify:migration": "npx tsx scripts/verify-migration.ts"
  }
}
```

**✅ Phase 3 Complete**: GraphQL integrated and MongoDB fully removed

---

## Rollback Strategy

### If Issues Arise in Phase 1:
```bash
# Drop Supabase tables
npx supabase db reset --db-url "$DATABASE_URL"

# Continue using MongoDB
# No code changes needed
```

### If Issues Arise in Phase 2:
```bash
# Revert middleware.ts to JWT-based auth
git checkout HEAD~1 middleware.ts

# Re-enable MongoDB
# Uncomment MONGODB_URI in .env.local

# Restart application
npm run dev
```

### If Issues Arise in Phase 3:
```bash
# Reinstall MongoDB
npm install mongoose mongodb

# Restore models from backup
git restore src/models/

# Revert environment variables
# Re-enable MONGODB_URI
```

### Emergency Rollback (Any Phase):
```bash
# Complete rollback to MongoDB
git checkout main
npm install
npm run dev
```

---

## Testing Checklist

### Phase 1 Testing
- [ ] All tables created in Supabase
- [ ] Row Level Security policies working
- [ ] Triggers functioning (updated_at)
- [ ] Data migration completed without errors
- [ ] ID mapping file generated
- [ ] Record counts match MongoDB

### Phase 2 Testing
- [ ] User authentication working
- [ ] Sign in/sign up flows functional
- [ ] Middleware protecting routes
- [ ] Session management working
- [ ] API routes querying Supabase
- [ ] No MongoDB connection errors

### Phase 3 Testing
- [ ] GraphQL endpoint accessible
- [ ] Queries returning correct data
- [ ] Mutations working properly
- [ ] Real-time subscriptions (if used)
- [ ] All features working end-to-end
- [ ] No console errors
- [ ] Performance acceptable

### Production Readiness
- [ ] Full backup of MongoDB data
- [ ] All environment variables updated
- [ ] Monitoring and logging configured
- [ ] Error tracking setup
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Documentation updated

---

## Post-Migration Checklist

1. **Monitor Performance**
   - Set up Supabase Analytics
   - Track query performance
   - Monitor error rates

2. **Update Documentation**
   - Update README.md
   - Update WARP.md
   - Document new database schema

3. **Team Training**
   - Train team on Supabase
   - Share GraphQL query patterns
   - Document common operations

4. **Optimize**
   - Add database indexes as needed
   - Optimize slow queries
   - Set up caching strategy

5. **Cleanup**
   - Archive MongoDB backups
   - Remove old migration scripts
   - Clean up unused dependencies

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **GraphQL Guide**: https://supabase.com/docs/guides/api/graphql
- **Auth Helpers**: https://supabase.com/docs/guides/auth/auth-helpers/nextjs
- **Row Level Security**: https://supabase.com/docs/guides/auth/row-level-security

---

**Migration Status**: ⏳ Ready to Start  
**Estimated Total Time**: 4-6 hours (excluding data migration time)  
**Recommended Approach**: Test each phase thoroughly before proceeding to the next

Good luck with your migration! 🚀
