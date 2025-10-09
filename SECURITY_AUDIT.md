# 🔒 Security Audit & Deployment Checklist

**Project**: Poligap AI Compliance Platform  
**Last Audit**: 2024  
**Status**: ⚠️ **CRITICAL SECURITY ISSUES FOUND**

---

## 🚨 CRITICAL SECURITY VULNERABILITIES

### 1. ❌ **NO ROW LEVEL SECURITY (RLS) ENABLED**

**SEVERITY**: 🔴 **CRITICAL**

**Issue**: All tables have `rls_enabled: false`

**Risk**:
- Any authenticated user can read ALL data
- Users can access other companies' data
- No data isolation between organizations
- Complete data breach risk

**Tables Affected**: ALL (12 tables)
- companies
- users
- members
- media
- agent_conversations
- chat_messages
- rulebase
- document_analysis
- audit_logs
- search_history
- feedback
- company_media

**FIX REQUIRED IMMEDIATELY**:
```sql
-- Enable RLS on ALL tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rulebase ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
```

---

### 2. ❌ **NO RLS POLICIES CONFIGURED**

**SEVERITY**: 🔴 **CRITICAL**

**Issue**: RLS is disabled, no policies exist

**Required Policies**:

#### Users Table
```sql
-- Users can only see their own profile
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);
```

#### Members Table (RBAC)
```sql
-- Members can view their company members
CREATE POLICY "View company members"
ON members FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM members 
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
  )
);

-- Only admins/owners can modify members
CREATE POLICY "Admins manage members"
ON members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM members
    WHERE user_id = auth.uid()
    AND company_id = members.company_id
    AND role IN ('admin', 'owner')
    AND status = 'ACTIVE'
  )
);
```

#### Chat & Conversations
```sql
-- Users can only see their own conversations
CREATE POLICY "View own conversations"
ON agent_conversations FOR SELECT
USING (enterprise_user_id = auth.uid());

-- Users can only create/update own conversations
CREATE POLICY "Manage own conversations"
ON agent_conversations FOR ALL
USING (enterprise_user_id = auth.uid());

-- Users can only see messages from their conversations
CREATE POLICY "View own messages"
ON chat_messages FOR SELECT
USING (
  conversation_id IN (
    SELECT id FROM agent_conversations
    WHERE enterprise_user_id = auth.uid()
  )
);
```

#### Rulebase
```sql
-- Users can view company rulebases
CREATE POLICY "View company rulebases"
ON rulebase FOR SELECT
USING (
  company_id IN (
    SELECT company_id FROM members
    WHERE user_id = auth.uid() AND status = 'ACTIVE'
  )
);

-- Users can manage their own rulebases
CREATE POLICY "Manage own rulebases"
ON rulebase FOR ALL
USING (user_id = auth.uid());
```

---

### 3. ❌ **API KEYS IN PLAIN TEXT**

**SEVERITY**: 🔴 **CRITICAL**

**Issue**: Found in context
```
SUPABASE_ACCESS_TOKEN: sbp_5279c67aada30b2e99fcf3742efcf0bd2b2a3ef1
```

**⚠️ THIS KEY IS NOW COMPROMISED - ROTATE IMMEDIATELY**

**Action Required**:
1. Go to Supabase Dashboard → Settings → API
2. Revoke existing access token
3. Generate new access token
4. Store in environment variables ONLY
5. NEVER commit to git
6. Add to .gitignore

---

### 4. ⚠️ **WEAK AUTHENTICATION**

**SEVERITY**: 🟠 **HIGH**

**Current Issues**:
- Using custom JWT instead of Supabase Auth
- No password policies enforced
- No MFA/2FA available
- Session management unclear
- No password reset flow

**Fix**: Migrate to Supabase Auth
```typescript
// Use Supabase Auth
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Sign up with email verification
await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    emailRedirectTo: 'https://your-app.com/auth/callback',
  },
});

// Enable MFA
await supabase.auth.mfa.enroll({ factorType: 'totp' });
```

---

### 5. ⚠️ **NO INPUT VALIDATION**

**SEVERITY**: 🟠 **HIGH**

**Issues**:
- No input sanitization in API routes
- No XSS protection on user inputs
- No SQL injection protection
- File uploads not validated

**Fix**: Add validation
```typescript
import { z } from 'zod';

// Example schema
const userSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  password: z.string().min(8).regex(/[A-Z]/).regex(/[0-9]/),
});

// Validate
const result = userSchema.safeParse(input);
if (!result.success) {
  return { error: result.error };
}
```

---

### 6. ⚠️ **FILE UPLOAD VULNERABILITIES**

**SEVERITY**: 🟠 **HIGH**

**Issues**:
- No file type validation
- No file size limits (set to 50MB)
- No malware scanning
- No content validation

**Fix**:
```typescript
// Validate file type
const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('Invalid file type');
}

// Validate file size (5MB max)
if (file.size > 5 * 1024 * 1024) {
  throw new Error('File too large');
}

// Scan for malware (use ClamAV or VirusTotal API)
await scanFile(file);
```

---

### 7. ⚠️ **NO RATE LIMITING**

**SEVERITY**: 🟠 **HIGH**

**Issues**:
- No rate limiting on API routes
- No DDoS protection
- No brute force protection on auth

**Fix**: Add Vercel Rate Limiting
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for');
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response('Too Many Requests', { status: 429 });
  }
  
  // Continue...
}
```

---

### 8. ⚠️ **LOGGING SENSITIVE DATA**

**SEVERITY**: 🟡 **MEDIUM**

**Issues**:
- Console.log statements in production code
- Logging user emails and IDs
- Error messages expose system details

**Fix**:
```typescript
// Remove console.log in production
if (process.env.NODE_ENV === 'production') {
  console.log = () => {};
}

// Use structured logging
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});

// Sanitize logs
logger.info('User action', { 
  userId: hashUserId(userId), // Hash, don't log raw ID
  action: 'login' 
});
```

---

### 9. ⚠️ **CORS MISCONFIGURATION**

**SEVERITY**: 🟡 **MEDIUM**

**Issue**: Need to verify CORS settings

**Required**:
```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: 'https://your-domain.com' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
};
```

---

### 10. ⚠️ **NO AUDIT TRAIL FOR CRITICAL ACTIONS**

**SEVERITY**: 🟡 **MEDIUM**

**Issue**: Audit logs table exists but not used

**Fix**: Log all critical actions
```typescript
async function createAuditLog(action: string, userId: string, metadata: any) {
  await supabase.from('audit_logs').insert({
    user_id: userId,
    company_id: getUserCompany(userId),
    action,
    entity_type: metadata.type,
    entity_id: metadata.id,
    metadata,
  });
}

// Use everywhere
await createAuditLog('DELETE_RULEBASE', userId, { type: 'rulebase', id: rulebaseId });
```

---

## 📋 RBAC (Role-Based Access Control)

### Current RBAC Issues

**Members table has roles**:
- ✅ `admin`
- ✅ `user`
- ✅ `owner`

**But NO enforcement in code!**

### Required RBAC Implementation

```typescript
// middleware/rbac.ts
export function requireRole(allowedRoles: string[]) {
  return async (req: Request) => {
    const user = await getAuthUser(req);
    const member = await supabase
      .from('members')
      .select('role, status')
      .eq('user_id', user.id)
      .eq('company_id', user.company_id)
      .single();
    
    if (!member || member.status !== 'ACTIVE') {
      throw new Error('Unauthorized');
    }
    
    if (!allowedRoles.includes(member.role)) {
      throw new Error('Forbidden');
    }
    
    return member;
  };
}

// Use in API routes
export async function DELETE(req: Request) {
  await requireRole(['admin', 'owner'])(req);
  // Only admins/owners can delete
}
```

---

## 🎯 User Management Features

### ✅ **Currently Implemented**

1. **User Registration** (`/api/users/signup`)
   - Email + password
   - Creates user profile
   - No email verification ⚠️

2. **User Login** (`/api/users/signin`)
   - Email + password
   - Returns JWT token
   - 7-day expiry

3. **User Profile** (`/api/users/profile`)
   - View/edit profile
   - Update details

4. **Company Members** (`/api/company/members/*`)
   - View company members
   - No role enforcement ⚠️

### ❌ **Missing Critical Features**

1. **Email Verification**
   - Users can register without verifying email
   - Spam risk

2. **Password Reset**
   - No forgot password flow
   - Users get locked out

3. **MFA/2FA**
   - No multi-factor authentication
   - Account takeover risk

4. **Session Management**
   - No way to view active sessions
   - No way to revoke sessions

5. **Role Management UI**
   - Can't promote/demote users
   - Can't change roles

---

## 🔐 Priority Fix List

### **Immediate (Deploy Blocker)** 🔴

1. ✅ Enable RLS on all tables
2. ✅ Apply RLS policies
3. ✅ Rotate exposed API key
4. ✅ Implement RBAC middleware
5. ✅ Add input validation

### **Before Production** 🟠

6. ✅ Migrate to Supabase Auth
7. ✅ Add email verification
8. ✅ Add password reset
9. ✅ Add rate limiting
10. ✅ Remove console.logs
11. ✅ Add file upload validation
12. ✅ Configure CORS properly

### **Post-Launch** 🟡

13. ✅ Add MFA/2FA
14. ✅ Add session management
15. ✅ Add malware scanning
16. ✅ Add comprehensive audit logging
17. ✅ Add security monitoring
18. ✅ Security penetration testing

---

## ✅ Deployment Checklist

### Environment Variables

```bash
# Supabase (DO NOT commit these!)
NEXT_PUBLIC_SUPABASE_URL=https://uzbozldsdzsfytsteqlb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AWS S3
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=your-bucket

# JWT (for legacy auth)
JWT_SECRET=generate-strong-random-secret

# Optional
REDIS_URL=your-redis-url (for rate limiting)
```

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... add all env vars
```

---

## 📊 Security Score

| Category | Current | Target | Status |
|----------|---------|--------|--------|
| Authentication | 4/10 | 9/10 | ⚠️ Needs work |
| Authorization | 2/10 | 9/10 | 🔴 Critical |
| Data Protection | 3/10 | 9/10 | 🔴 Critical |
| Input Validation | 3/10 | 9/10 | 🟠 High priority |
| Logging & Monitoring | 5/10 | 8/10 | 🟡 Medium |
| Infrastructure | 7/10 | 9/10 | 🟢 Good |

**Overall Security Score**: **3.5/10** 🔴 **NOT PRODUCTION READY**

---

## 🎯 Action Plan

1. **TODAY**: Enable RLS + policies
2. **THIS WEEK**: Migrate to Supabase Auth
3. **BEFORE LAUNCH**: Add validation + rate limiting
4. **AFTER LAUNCH**: Add MFA + monitoring

---

**Status**: ⚠️ **CRITICAL SECURITY FIXES REQUIRED**  
**Production Ready**: ❌ **NO**  
**Estimated Fix Time**: 2-3 days
