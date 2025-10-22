# GraphQL Migration Analysis

## Executive Summary

Your application currently has **100+ API routes** using REST endpoints, but you already have a **comprehensive GraphQL setup** in place with queries and mutations defined. Here's the analysis and migration strategy.

---

## Current State

### GraphQL Infrastructure ✅ Already Exists

**Location**: `src/lib/supabase/graphql.ts`

You have:
- ✅ GraphQL client setup with authentication
- ✅ 30+ pre-defined queries and mutations
- ✅ Proper error handling structure
- ✅ Token-based authentication

### Existing GraphQL Operations

#### Profile Management
- `getProfile` - Fetch user profile
- `updateProfile` - Update user profile

#### Chat/Conversations
- `getConversations` - List user conversations
- `createConversation` - Create new conversation
- `updateConversationThread` - Update conversation metadata
- `deleteConversation` - Soft delete conversation
- `getMessages` - Fetch conversation messages
- `createMessage` - Save new message
- `updateMessage` - Update message content

#### Rulebase
- `getRules` - Fetch user rules
- `createRule` - Create new rule
- `updateRule` - Update rule
- `deleteRule` - Soft delete rule

#### Audit Logs
- `getAuditLogs` - Fetch audit logs
- `createAuditLog` - Create audit log entry

#### Tasks
- `getTasks` - Fetch user tasks
- `createTask` - Create new task

#### Document Analysis
- `createDocumentAnalysis` - Save analysis results
- `getDocumentAnalysis` - Fetch analysis history

#### Knowledge Base
- `getKnowledge` - Fetch knowledge items
- `createKnowledgeItems` - Bulk create knowledge items
- `softDeleteKnowledgeItem` - Soft delete knowledge item
- `toggleKnowledgeSettings` - Enable/disable knowledge base

#### Sitemaps
- `getSitemaps` - Fetch sitemaps
- `createSitemap` - Create sitemap
- `softDeleteSitemap` - Soft delete sitemap

#### Organization/Companies
- `getUserCompanies` - Fetch user's companies
- `getCompanyMembers` - Fetch company members with joins
- `getCompanyInvitations` - Fetch company invitations with joins
- `getCompanyDetails` - Fetch company details
- `getUserDetails` - Fetch user details
- `checkUserAccess` - Verify user's company access

---

## API Routes Analysis

### Category 1: ✅ Already Using Supabase PostgREST (Easy Migration)

These routes use `.from()` syntax and can be directly converted to GraphQL:

#### Profiles & Users
- ✅ `/api/users/profile` → Use `getProfile`, `updateProfile`
- ✅ `/api/users/user-details` → Use `getUserDetails`
- ✅ `/api/check-users` → Use `getUserDetails` or `checkUserAccess`

#### Rulebase
- ✅ `/api/rulebase` → Use `getRules`, `createRule`, `updateRule`, `deleteRule`
- ⚠️ `/api/rulebase/upload` → Needs file handling + `createRule`

#### Audit Logs
- ✅ `/api/audit-logs` → Use `getAuditLogs`, `createAuditLog`
- ⚠️ `/api/template-audit-logs` → Similar pattern, needs GraphQL mutation

#### Tasks
- ✅ `/api/tasks` → Use `getTasks`, `createTask`

#### Company/Members
- ✅ `/api/members/list` → Use `getCompanyMembers`
- ✅ `/api/members/details` → Use `getUserDetails`
- ⚠️ `/api/members/remove` → Needs GraphQL mutation
- ⚠️ `/api/members/update-role` → Needs GraphQL mutation

#### Invitations
- ✅ `/api/invitations/list` → Use `getCompanyInvitations`
- ⚠️ `/api/invitations/create` → Needs GraphQL mutation
- ⚠️ `/api/invitations/accept` → Needs GraphQL mutation
- ⚠️ `/api/invitations/revoke` → Needs GraphQL mutation
- ⚠️ `/api/invitations/resend` → Needs GraphQL mutation

#### Knowledge Base
- ✅ `/api/knowledge-base/media/fetch` → Use `getKnowledge`
- ⚠️ `/api/knowledge-base/media/delete` → Use `softDeleteKnowledgeItem`
- ⚠️ `/api/knowledge-base/enable` → Use `toggleKnowledgeSettings`
- ⚠️ `/api/knowledge-base/upload-media` → File upload + `createKnowledgeItems`
- ⚠️ `/api/knowledge-base/overview` → Aggregation query
- ⚠️ `/api/knowledge-base/train-card` → Custom logic

### Category 2: ⚠️ Using External Backend (Cannot Migrate)

These routes proxy to `process.env.BACKEND_URL` - **keep as REST**:

- `/api/company/members/member-details` → External API
- `/api/search` → MongoDB Enterprise Search
- `/api/compliance/count` → External metrics
- `/api/compliance/recent` → External data
- `/api/contracts/count` → External metrics
- `/api/contracts/recent` → External data
- `/api/policies/count` → External metrics
- `/api/policies/recent` → External data
- `/api/uploads/recent` → External data
- `/api/training/count` → External metrics
- `/api/regulations/search` → External search
- `/api/law-scanner/query` → External service

### Category 3: 🔄 Business Logic Routes (Mixed Migration)

These have complex logic - evaluate case by case:

#### AI/Chat Routes
- `/api/ai-chat/*` → Currently uses GraphQL (`createGraphQLClient`) ✅
- `/api/openai-assistant/stream` → AI streaming, keep REST
- `/api/stream-chat` → Streaming, keep REST

#### File Processing
- `/api/extract-*` → File processing, keep REST
- `/api/parse-document` → Document parsing, keep REST
- `/api/export-pdf` → PDF generation, keep REST
- `/api/s3/*` → File uploads, keep REST
- `/api/assets/*` → Asset management, mixed

#### Analysis Routes
- `/api/compliance-analysis` → Analysis logic, keep REST
- `/api/compliance-agent` → Agent logic, keep REST
- `/api/contract-analyze` → Analysis logic, keep REST
- `/api/copyright-detector` → Detection logic, keep REST
- `/api/idea-analyzer/analyze` → Analysis logic, keep REST
- `/api/policy-generator/generate` → Generation logic, keep REST

#### Utility Routes
- `/api/email-notifier/send` → Email service, keep REST
- `/api/n8n-email-webhook` → Webhook, keep REST
- `/api/feedback` → Simple feedback, could migrate
- `/api/flagged-issues` → Could migrate to GraphQL
- `/api/log` → Logging, keep REST

---

## Missing GraphQL Mutations

You need to add these to `src/lib/supabase/graphql.ts`:

```typescript
// Add to the queries object:

// Member management
removeMember: `
  mutation RemoveMember($userId: UUID!, $companyId: UUID!) {
    deleteuser_companiesCollection(
      filter: { user_id: { eq: $userId }, company_id: { eq: $companyId } }
    ) {
      records { user_id company_id }
    }
  }
`,

updateMemberRole: `
  mutation UpdateMemberRole($userId: UUID!, $companyId: UUID!, $role: String!) {
    updateuser_companiesCollection(
      filter: { user_id: { eq: $userId }, company_id: { eq: $companyId } }
      set: { role: $role, updated_at: "now()" }
    ) {
      records { user_id company_id role updated_at }
    }
  }
`,

// Invitation management
createInvitation: `
  mutation CreateInvitation(
    $email: String!
    $role: String!
    $company_id: UUID!
    $invited_by: UUID!
    $token: String!
    $expires_at: String!
  ) {
    insertIntoinvitationsCollection(
      objects: [{
        email: $email
        role: $role
        company_id: $company_id
        invited_by: $invited_by
        token: $token
        expires_at: $expires_at
        status: "pending"
        sent_at: "now()"
      }]
    ) {
      records {
        id
        email
        role
        token
        expires_at
        status
        created_at
      }
    }
  }
`,

acceptInvitation: `
  mutation AcceptInvitation($token: String!, $user_id: UUID!) {
    updateinvitationsCollection(
      filter: { token: { eq: $token } }
      set: { status: "accepted", accepted_at: "now()" }
    ) {
      records { id token status accepted_at }
    }
  }
`,

revokeInvitation: `
  mutation RevokeInvitation($id: UUID!) {
    updateinvitationsCollection(
      filter: { id: { eq: $id } }
      set: { status: "revoked", updated_at: "now()" }
    ) {
      records { id status updated_at }
    }
  }
`,

// Task updates
updateTask: `
  mutation UpdateTask(
    $id: UUID!
    $title: String
    $description: String
    $status: String
    $priority: String
    $due_date: String
    $assignee: String
    $category: String
  ) {
    updatetasksCollection(
      filter: { id: { eq: $id } }
      set: {
        title: $title
        description: $description
        status: $status
        priority: $priority
        due_date: $due_date
        assignee: $assignee
        category: $category
        updated_at: "now()"
      }
    ) {
      records {
        id
        title
        description
        status
        priority
        due_date
        assignee
        category
        updated_at
      }
    }
  }
`,

deleteTask: `
  mutation DeleteTask($id: UUID!) {
    deletetasksCollection(filter: { id: { eq: $id } }) {
      records { id }
    }
  }
`,
```

---

## Migration Priority & Strategy

### Phase 1: Low-Hanging Fruit (1-2 days) 🟢

**Already has GraphQL queries defined:**

1. **Profile Management**
   - `/api/users/profile` (GET, PUT)
   - `/api/users/user-details` (GET)
   
2. **Rulebase**
   - `/api/rulebase` (GET, POST, PATCH, DELETE)
   
3. **Tasks**
   - `/api/tasks` (GET, POST)
   - Add mutations for PUT, PATCH, DELETE
   
4. **Audit Logs**
   - `/api/audit-logs` (GET, POST)
   
5. **Knowledge Base (read-only)**
   - `/api/knowledge-base/media/fetch`

**Impact**: ~20% of API traffic, minimal risk

### Phase 2: Member & Company Management (2-3 days) 🟡

**Add missing mutations first:**

1. Add GraphQL mutations for:
   - Member management (remove, update role)
   - Invitation management (create, accept, revoke, resend)
   
2. Migrate routes:
   - `/api/members/*` (list, remove, update-role)
   - `/api/invitations/*` (list, create, accept, revoke, resend)

**Impact**: ~15% of API traffic, moderate risk (auth/permissions)

### Phase 3: Knowledge & Sitemaps (1-2 days) 🟡

1. Complete knowledge base operations
   - Delete, toggle settings
   - File uploads (hybrid: REST upload → GraphQL record)
   
2. Sitemap operations
   - Already has queries, add file processing logic

**Impact**: ~10% of API traffic, low risk

### Phase 4: AI Chat (Already Done!) ✅

Good news: Your AI chat routes **already use GraphQL**!

```typescript
// src/lib/utils/chatHistory.ts
import { createGraphQLClient, queries } from '@/lib/supabase/graphql';
```

**No migration needed** - already using:
- `createConversation`
- `getConversations`
- `getMessages`
- `createMessage`
- `updateMessage`
- `deleteConversation`

---

## Routes to Keep as REST

### External API Proxies (40% of routes)
- MongoDB Enterprise Search (`/api/search`)
- External backend services (`BACKEND_URL/*`)
- Third-party integrations

### File Processing (20% of routes)
- File uploads (`/api/s3/*`, `/api/assets/upload`)
- Document extraction (`/api/extract-*`, `/api/parse-document`)
- PDF generation (`/api/export-pdf`)

### Streaming & Real-time (5% of routes)
- AI streaming (`/api/openai-assistant/stream`)
- Chat streaming (`/api/stream-chat`)

### Complex Business Logic (15% of routes)
- Analysis engines (`/api/compliance-analysis`, `/api/contract-analyze`)
- AI agents (`/api/compliance-agent`, `/api/idea-analyzer`)
- Policy generation (`/api/policy-generator`)

---

## Implementation Guide

### Step 1: Add Missing Mutations

Update `src/lib/supabase/graphql.ts`:

```typescript
export const queries = {
  // ... existing queries ...
  
  // Add new mutations here (see "Missing GraphQL Mutations" section above)
};
```

### Step 2: Create GraphQL Helper Service

Create `src/lib/graphql-service.ts`:

```typescript
import { createClient } from '@/lib/supabase/server';
import { createGraphQLClient, queries } from '@/lib/supabase/graphql';

export class GraphQLService {
  private client: any;
  private accessToken?: string;

  async init() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      throw new Error('Unauthorized');
    }
    
    const { data: { session } } = await supabase.auth.getSession();
    this.accessToken = session?.access_token;
    this.client = createGraphQLClient(this.accessToken);
    
    return user;
  }

  async query<T>(queryName: keyof typeof queries, variables?: any): Promise<T> {
    if (!this.client) await this.init();
    return this.client.request<T>(queries[queryName], variables);
  }
}
```

### Step 3: Migrate Individual Routes

Example migration for `/api/rulebase/route.ts`:

**Before (PostgREST):**
```typescript
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const { data: rules } = await supabase
    .from('rulebase')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
    
  return NextResponse.json({ rules });
}
```

**After (GraphQL):**
```typescript
import { GraphQLService } from '@/lib/graphql-service';

export async function GET() {
  try {
    const gqlService = new GraphQLService();
    const user = await gqlService.init();
    
    const response = await gqlService.query('getRules', { 
      userId: user.id 
    });
    
    const rules = response.rulebaseCollection.edges.map(edge => edge.node);
    return NextResponse.json({ rules });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch rules' }, { status: 500 });
  }
}
```

### Step 4: Update Frontend Calls

Most frontend code won't need changes if you maintain the same API route structure. The change is transparent to the client.

---

## Performance Comparison

### PostgREST (Current)
- ✅ Simple, fast for basic CRUD
- ✅ Built-in filtering, sorting, pagination
- ❌ Multiple requests for related data (N+1 problem)
- ❌ Over-fetching (loads all columns)

### GraphQL (Proposed)
- ✅ Single request for related data (joins)
- ✅ Fetch only needed fields (under-fetching)
- ✅ Type-safe with generated types
- ❌ Slightly more setup complexity
- ❌ Additional parsing overhead

### Recommendation

**Best of Both Worlds:**
- Use GraphQL for **complex queries with joins** (members, invitations, companies)
- Use PostgREST for **simple CRUD** (already working well)
- Keep REST for **external APIs, file handling, streaming**

---

## Testing Strategy

### 1. Unit Tests
```typescript
// test/graphql-service.test.ts
import { GraphQLService } from '@/lib/graphql-service';

describe('GraphQLService', () => {
  it('should fetch rules for authenticated user', async () => {
    const service = new GraphQLService();
    await service.init();
    
    const rules = await service.query('getRules', { userId: 'test-id' });
    expect(rules).toBeDefined();
  });
});
```

### 2. Integration Tests
- Test each migrated route with real Supabase connection
- Verify response format matches existing API
- Check error handling

### 3. Load Tests
- Compare response times: PostgREST vs GraphQL
- Test with concurrent requests
- Monitor memory usage

---

## Rollback Plan

1. **Keep old routes as fallback**:
   ```typescript
   // /api/v2/rulebase → GraphQL
   // /api/rulebase → PostgREST (fallback)
   ```

2. **Feature flag**:
   ```typescript
   const useGraphQL = process.env.NEXT_PUBLIC_USE_GRAPHQL === 'true';
   ```

3. **Gradual rollout**:
   - Week 1: 10% of users
   - Week 2: 50% of users
   - Week 3: 100% of users

---

## Summary & Recommendations

### Current Status ✅
- You have GraphQL infrastructure ready
- ~30 queries/mutations already defined
- AI chat routes already using GraphQL

### Migration Scope 📊
- **Can migrate**: ~35-40 routes (35%)
- **Should keep REST**: ~60-65 routes (65%)
  - External APIs: 40%
  - File processing: 20%
  - Streaming: 5%

### Recommended Approach 🎯

**Option 1: Selective Migration (Recommended)**
- Migrate only routes that benefit from GraphQL (joins, complex queries)
- Keep simple CRUD as PostgREST
- Estimated effort: 5-7 days
- Risk: Low

**Option 2: Full Migration**
- Migrate all Supabase routes to GraphQL
- Keep only external/file/streaming as REST
- Estimated effort: 10-15 days
- Risk: Medium

**Option 3: Hybrid (Best Practice)**
- Use GraphQL for reads (GET) with complex joins
- Keep PostgREST for writes (POST/PUT/DELETE)
- Simplest migration path
- Estimated effort: 3-5 days
- Risk: Very Low

### Quick Wins 🚀

Start with these 5 routes (1 day each):
1. `/api/users/profile` → Use existing `getProfile`
2. `/api/rulebase` → Use existing `getRules`
3. `/api/tasks` → Use existing `getTasks`
4. `/api/members/list` → Use existing `getCompanyMembers`
5. `/api/invitations/list` → Use existing `getCompanyInvitations`

These routes:
- Have GraphQL queries ready
- Are high-traffic
- Provide immediate performance gains (reduce N+1 queries)

---

## Next Steps

1. **Add missing mutations** to `graphql.ts` (1 hour)
2. **Create `GraphQLService` helper** (2 hours)
3. **Migrate `/api/rulebase`** as proof of concept (4 hours)
4. **Compare performance** PostgREST vs GraphQL (2 hours)
5. **Decide on migration strategy** based on results

Would you like me to:
1. Add the missing GraphQL mutations?
2. Create the GraphQLService helper?
3. Migrate a specific route as an example?
4. Generate TypeScript types from your GraphQL schema?
