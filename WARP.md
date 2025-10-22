# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Poligap AI is an enterprise search & compliance platform built with Next.js 15, React 19, and Supabase. The application provides AI-powered compliance checking, contract review, policy generation, and enterprise search capabilities.

## Development Commands

### Setup & Development
```bash
# Install dependencies
npm install

# Development server (standard)
npm run dev

# Development server (with Turbopack - faster)
npm run dev:turbo

# Build for production
npm run build

# Start production server
npm start
```

### Code Quality & Linting
```bash
# Run ESLint
npm run lint
```

### Security & Testing
```bash
# Run SonarQube security scan
npm run security:scan

# Setup environment for security checks
npm run security:setup

# Run security checks
npm run security:check

# Verify GraphQL migration
npm run test:gql-migration
```

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Configure Supabase credentials (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
3. Add MongoDB connection strings (MONGODB_URI, MONGODB_ENTERPRISE_SEARCH_URI)
4. Configure API URLs and API keys as needed

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15.3.2 with App Router
- **UI**: React 19, Tailwind CSS v4, Radix UI, Material UI
- **State Management**: Zustand with persist middleware
- **Data Fetching**: TanStack Query v5 (React Query)
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL with GraphQL), MongoDB
- **Forms**: React Hook Form + Zod validation
- **AI Integration**: OpenAI, Google Gemini, Portkey AI

### Project Structure
```
src/
├── app/                      # Next.js App Router
│   ├── (app)/               # Authenticated app routes
│   │   ├── dashboard/       # Main dashboard
│   │   ├── search/          # Enterprise search
│   │   ├── chat/            # AI chat interface  
│   │   ├── compliance-check/
│   │   ├── contract-review/
│   │   ├── policy-generator/
│   │   └── ai-agents/       # AI agent management
│   ├── auth/                # Authentication pages
│   └── api/                 # API routes
├── components/              # Reusable UI components
│   ├── ui/                  # Base UI components (shadcn)
│   ├── common/              # Shared components
│   └── [feature]/           # Feature-specific components
├── lib/                     # Utilities and configurations
│   ├── supabase/            # Supabase client & GraphQL
│   ├── cache-manager.ts     # Client-side cache system
│   ├── api-client.ts        # API client with caching
│   └── queries/             # TanStack Query hooks
├── stores/                  # Zustand state stores
│   ├── user-store.ts        # User state (persisted)
│   ├── company-store.ts     # Company state (persisted)
│   ├── audit-logs-store.ts  # Audit logs with caching
│   ├── rulebase-store.ts    # Rulebase with caching
│   └── tasks-store.ts       # Tasks management
├── hooks/                   # Custom React hooks
│   ├── use-cache.ts         # Caching hooks
│   ├── use-auth.ts          # Authentication
│   └── use-activity-tracker.ts
├── types/                   # TypeScript type definitions
└── utils/                   # Utility functions
```

### Data Flow Architecture

#### Authentication Flow
1. Middleware (`middleware.ts`) checks authentication on all routes
2. Public routes: `/auth/signin`, `/auth/signup`
3. Protected routes redirect to signin if not authenticated
4. Supabase SSR handles session management with cookie-based auth
5. User data is stored in Zustand with localStorage persistence

#### State Management Strategy
- **Zustand Stores**: Primary state management
  - `user-store`: Persisted user data
  - `company-store`: Persisted company data  
  - `rulebase-store`: Rules with cache manager integration
  - `audit-logs-store`: Audit logs with TTL caching
  - `tasks-store`: Task management state
  
- **TanStack Query**: Server state & API caching
  - Used for data fetching and synchronization
  - Automatic background refetching
  - Optimistic updates for mutations
  - See `TANSTACK_QUERY_GUIDE.md` for patterns

#### Caching System
The application implements a sophisticated multi-layer caching strategy:

1. **Cache Manager** (`lib/cache-manager.ts`):
   - In-memory cache with TTL
   - localStorage persistence option
   - Automatic cleanup of expired entries
   - Prefix-based organization (e.g., 'audit', 'rulebase', 'user')

2. **API Client Caching** (`lib/api-client.ts`):
   - Request-level caching with configurable TTL
   - Automatic cache invalidation on mutations
   - Supports batch requests

3. **Next.js ISR** (Incremental Static Regeneration):
   - Page-level caching with `revalidate` export
   - Static pages: 1 hour (`revalidate = 3600`)
   - Dynamic pages: 5 minutes (`revalidate = 300`)
   - Real-time pages: no cache (`dynamic = 'force-dynamic'`)

4. **TanStack Query Cache**:
   - Automatic request deduplication
   - Background refetching
   - Query key-based invalidation

**Important**: Always use appropriate cache TTLs:
- Short (5 min): Frequently changing data (audit logs, activities)
- Medium (10-30 min): Moderately stable data (user lists, rules)
- Long (1-2 hours): Rarely changing data (static configs)

See `CACHING.md` for comprehensive caching documentation.

#### GraphQL Integration
- Supabase GraphQL endpoint via `graphql-request`
- Client creation in `lib/supabase/graphql.ts`
- Query definitions include profiles, conversations, messages
- Access token passed in Authorization header
- Response caching in API client layer

### Key Patterns & Conventions

#### Component Patterns
1. **Server Components by Default**: Use 'use client' directive only when necessary (hooks, state, event handlers)
2. **Layout Caching**: Export `revalidate` constant in pages for Next.js ISR
3. **Error Handling**: Use try-catch with toast notifications from `components/toast-varients.tsx`

#### API Integration
```typescript
// Use the api-client for consistent caching
import { apiClient } from '@/lib/api-client';

const data = await apiClient.get('/api/endpoint', {
  useCache: true,
  cacheTTL: 300, // 5 minutes
});
```

#### Store Pattern with Caching
```typescript
// Zustand stores should integrate cache-manager
import { cacheManager } from '@/lib/cache-manager';

export const useStore = create((set, get) => ({
  data: [],
  fetchData: async (force = false) => {
    const cacheKey = 'store-data';
    
    if (!force) {
      const cached = cacheManager.get(cacheKey, { prefix: 'store-prefix' });
      if (cached) {
        set({ data: cached });
        return;
      }
    }
    
    const response = await fetch('/api/data');
    const data = await response.json();
    
    cacheManager.set(cacheKey, data, {
      ttl: 10 * 60 * 1000,
      prefix: 'store-prefix'
    });
    
    set({ data });
  }
}));
```

#### Form Handling
- Use React Hook Form with Zod validation
- Define Zod schemas for type safety
- Use `@hookform/resolvers/zod` for integration

#### Activity Tracking
- Use `useActivityTracker` hook to track user actions
- Call `trackPageVisit(pageName)` on page mount
- Call `trackAction(actionType, details)` for significant user actions

### Important Configuration

#### TypeScript Path Alias
- `@/*` maps to `./src/*` in imports
- Configured in `tsconfig.json`

#### Image Optimization
- Remote patterns configured in `next.config.ts`:
  - AWS S3 buckets
  - Supabase storage
  - Google user content
  - Unsplash, Shutterstock

#### SVG Handling
- SVG files can be imported as React components
- Webpack configured with `@svgr/webpack` loader

#### Middleware
- All routes except `/auth/*`, static files, and public assets require authentication
- Session refresh handled automatically by Supabase middleware
- Authenticated users accessing auth pages redirect to `/home`

### Common Development Workflows

#### Adding a New Page
1. Create `page.tsx` in appropriate `app/(app)/[route]/` directory
2. Export `revalidate` constant based on data freshness needs
3. Use server components where possible
4. Add route to sidebar in `components/app-sidebar.tsx`

#### Adding API Route
1. Create route handler in `app/api/[endpoint]/route.ts`
2. Use Next.js route handler conventions (GET, POST, etc.)
3. Implement error handling with try-catch
4. Return JSON responses with status codes

#### Working with Supabase
- **Client-side**: Use `createClient()` from `@/lib/supabase/client`
- **Server-side**: Use `createClient()` from `@/lib/supabase/server`
- **GraphQL**: Use `createGraphQLClient()` with access token

#### Deploying New Features
1. Run `npm run lint` to check code quality
2. Test locally with `npm run dev`
3. Build with `npm run build` to verify
4. Check for console errors (removed in production by compiler)

### Performance Considerations

1. **Lazy Loading**: Use dynamic imports for heavy components
2. **Image Optimization**: Always use `next/image` component
3. **Code Splitting**: Leverage automatic code splitting via App Router
4. **Cache Warming**: Consider prefetching data for common user paths
5. **Bundle Size**: Monitor bundle size, avoid large dependencies

### Security Notes

- Console logs automatically removed in production/staging builds
- Middleware enforces authentication on protected routes
- API routes should validate authentication server-side
- Environment variables: prefix public variables with `NEXT_PUBLIC_`
- SonarQube integration available for security scanning

### MCP Integration

The project uses Model Context Protocol (MCP) for AI tooling:
- Supabase MCP server configured (`.vscode/mcp.json`)
- Chrome DevTools MCP for debugging
- Figma MCP for design integration
- Context7 MCP for additional context

**Note**: MCP configuration contains API keys - ensure this file is in `.gitignore`

### Debugging Tips

1. **TanStack Query DevTools**: Available in development mode (bottom-right icon)
2. **React DevTools**: Use browser extension for component inspection
3. **Cache Debugging**: Check browser console for cache hit/miss logs
4. **Network Tab**: Monitor API calls and GraphQL queries
5. **Middleware**: Add console logs in `middleware.ts` for auth debugging

### Common Issues & Solutions

**Issue**: "Module not found" errors
- Check TypeScript path alias configuration
- Verify import paths use `@/` prefix correctly

**Issue**: Authentication redirects not working
- Check middleware configuration
- Verify Supabase environment variables are set
- Clear cookies and retry

**Issue**: Stale cache data
- Use force refresh in fetch functions
- Check cache TTL values
- Clear cache with `cacheManager.clearPrefix()`

**Issue**: Hydration errors
- Ensure server and client render the same initial UI
- Avoid using browser-only APIs in server components
- Check for localStorage/sessionStorage usage in RSC

### Documentation References

- `README.md`: Quick start and feature overview
- `CACHING.md`: Complete caching implementation guide
- `TANSTACK_QUERY_GUIDE.md`: TanStack Query patterns and examples
- `CLIENT_COMPONENT_CACHING_FIX.md`: Client component caching fixes
- `.env.example`: Environment variable reference
