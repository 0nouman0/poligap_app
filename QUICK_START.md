# 🚀 Quick Start Guide - Security & Deployment

## ⚡ Setup in 5 Minutes

### Step 1: Environment Variables

Create `.env.local` with:

```bash
# Supabase (REQUIRED)
NEXT_PUBLIC_SUPABASE_URL=https://uzbozldsdzsfytsteqlb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-key-here

# AWS S3 (for image uploads)
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_BUCKET_NAME=your-bucket

# JWT (for legacy auth migration)
JWT_SECRET=your-strong-random-secret
```

### Step 2: Run Security Setup

```bash
# Install dependencies
npm install

# Run security setup (enables RLS + creates sample users)
npm run setup:security
```

This will:
- ✅ Enable Row Level Security on all 12 tables
- ✅ Apply 40+ security policies
- ✅ Create 2 sample companies
- ✅ Create 10 sample users with different roles
- ✅ Set up RBAC helper functions

### Step 3: Test with Sample Accounts

**Acme Corporation:**
- `owner@acme.com` (Owner) - Password: `Password123!`
- `admin@acme.com` (Admin) - Password: `Password123!`
- `user1@acme.com` (User) - Password: `Password123!`

**TechStart Inc:**
- `owner@techstart.io` (Owner) - Password: `Password123!`
- `admin@techstart.io` (Admin) - Password: `Password123!`
- `user1@techstart.io` (User) - Password: `Password123!`

### Step 4: Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔒 Security Status

| Feature | Status | Priority |
|---------|--------|----------|
| RLS Enabled | ✅ Ready | 🔴 Critical |
| RLS Policies | ✅ Ready | 🔴 Critical |
| Sample Users | ✅ Ready | 🟢 Optional |
| RBAC Functions | ✅ Ready | 🔴 Critical |
| Input Validation | ⚠️ Partial | 🟠 High |
| Rate Limiting | ❌ Missing | 🟠 High |
| Supabase Auth Migration | ⚠️ In Progress | 🟠 High |

**Overall Status:** ⚠️ **SECURE FOR DEVELOPMENT** | 🔴 **NOT PRODUCTION READY**

---

## 📋 What's Been Done

### ✅ Phase 1: Database & Schema
- PostgreSQL schema created in Supabase
- All tables migrated with proper relationships
- Storage buckets configured
- GraphQL endpoint enabled

### ✅ Phase 2: Security & RLS
- Row Level Security enabled on all tables
- Comprehensive policies for multi-tenant isolation
- RBAC based on `members.role` (owner/admin/user)
- Helper functions for permission checks

### ✅ Phase 3: Sample Data
- 2 companies: Acme Corp, TechStart Inc
- 10 users across different roles
- Users linked to companies via `members` table
- Ready for RBAC testing

---

## ⚠️ Before Production

### Critical Fixes Required

1. **Rotate API Keys** 🔴
   - Exposed Supabase token in conversation
   - Generate new access token
   - Never commit to git

2. **Complete Auth Migration** 🟠
   - Replace custom JWT with Supabase Auth
   - Implement email verification
   - Add password reset flow

3. **Add Input Validation** 🟠
   - Install `zod` (already in dependencies)
   - Validate all API inputs
   - Sanitize user inputs

4. **Add Rate Limiting** 🟠
   ```bash
   npm install @upstash/ratelimit @upstash/redis
   ```

5. **Configure CORS** 🟡
   - Set proper origins in `next.config.js`
   - Restrict API access

6. **Audit Logging** 🟡
   - Log all critical actions
   - Use `audit_logs` table
   - Track deletions, updates

---

## 🎯 Role-Based Access Control (RBAC)

### How It Works

```
┌─────────────┐
│   USERS     │
│   (auth)    │
└──────┬──────┘
       │
       │ linked via user_id
       │
       ▼
┌─────────────┐
│   MEMBERS   │◄─── Core RBAC table
│             │     - company_id
│             │     - user_id
│             │     - role (owner/admin/user)
│             │     - status (ACTIVE/INACTIVE)
└──────┬──────┘
       │
       │ controls access to
       │
       ▼
┌────────────────────────────────┐
│  All Company Data              │
│  - Rulebase                    │
│  - Document Analysis           │
│  - Conversations & Messages    │
│  - Media & Files               │
│  - Search History & Feedback   │
└────────────────────────────────┘
```

### Role Permissions

| Action | User | Admin | Owner |
|--------|------|-------|-------|
| View own data | ✅ | ✅ | ✅ |
| View company data | ✅ | ✅ | ✅ |
| Create own resources | ✅ | ✅ | ✅ |
| Update own resources | ✅ | ✅ | ✅ |
| Delete own resources | ✅ | ✅ | ✅ |
| Manage company members | ❌ | ✅ | ✅ |
| Delete company resources | ❌ | ✅ | ✅ |
| Update company settings | ❌ | ❌ | ✅ |

---

## 🚢 Deploy to Production

### Option 1: Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Add environment variables via Vercel dashboard
# or CLI:
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
# ... add all env vars
```

### Option 2: Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t poligap .
docker run -p 3000:3000 --env-file .env poligap
```

---

## 📚 Important Files

| File | Purpose |
|------|---------|
| `SECURITY_AUDIT.md` | Complete security audit & checklist |
| `supabase/migrations/enable_rls_policies.sql` | RLS policies SQL |
| `scripts/setup-security.ts` | Security setup automation |
| `src/lib/supabase/init.ts` | Supabase initialization |
| `src/lib/supabase/graphql.ts` | GraphQL client utilities |
| `WARP.md` | Project documentation for AI |

---

## 🆘 Troubleshooting

### Error: "Missing environment variables"
- Copy `.env.example` to `.env.local`
- Fill in all required values
- Restart dev server

### Error: "RLS policy denied"
- Run `npm run setup:security` to apply policies
- Check user has ACTIVE status in `members` table
- Verify user belongs to company

### Error: "Failed to create user"
- User email may already exist
- Check Supabase Auth dashboard
- Reset password if needed

### Can't log in with sample users
- Verify Supabase Auth is configured
- Check email/password are correct: `Password123!`
- Look at browser console for errors

---

## 📊 Testing Checklist

- [ ] Can create new user account
- [ ] Can log in with owner@acme.com
- [ ] Owner can see Acme Corp data only
- [ ] Owner CANNOT see TechStart data
- [ ] Admin can manage members
- [ ] User CANNOT manage members
- [ ] User can create own resources
- [ ] User CANNOT delete company resources
- [ ] Audit logs capture actions
- [ ] File uploads work (S3 + Supabase)

---

## 🎉 Success Criteria

You know it's working when:

1. ✅ All sample users can log in
2. ✅ Users only see their company's data
3. ✅ RBAC permissions work as expected
4. ✅ No unauthorized access between companies
5. ✅ Audit logs track critical actions
6. ✅ File uploads work correctly
7. ✅ No console errors in browser

---

## 📞 Need Help?

Check these resources:

1. **Security Audit**: `SECURITY_AUDIT.md` - Complete security checklist
2. **Project Docs**: `WARP.md` - Full project documentation
3. **Supabase Docs**: https://supabase.com/docs
4. **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security

---

**Next Step**: Run `npm run setup:security` to get started! 🚀
