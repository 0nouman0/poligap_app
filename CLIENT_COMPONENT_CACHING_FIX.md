# Client Component Caching Fix

## Problem
Next.js was throwing errors:
```
Invalid revalidate value "function() { ... }" on "/path", must be a non-negative number or false
```

## Root Cause
The `export const revalidate` directive was added to **Client Components** (components with `"use client"` at the top). This directive **only works on Server Components**.

## Why This Happens
- **Server Components** run on the server and can use ISR (Incremental Static Regeneration) with `revalidate`
- **Client Components** run in the browser and use React hooks (`useState`, `useEffect`, etc.)
- Client Components cannot use `revalidate` because they're not server-rendered

## Solution
Removed `export const revalidate` from all Client Components. These components already have proper caching through:

1. **TanStack Query** - Client-side data caching and synchronization
2. **Zustand Stores** - State management with built-in caching
3. **React Query DevTools** - For debugging cache state

## Files Fixed (Client Components)
Removed `revalidate` export from:

### App Pages
- ✅ `/rulebase/page.tsx` - Uses `useRulebaseStore` for caching
- ✅ `/my-tasks/page.tsx` - Uses TanStack Query hooks
- ✅ `/chat/page.tsx` - Real-time data with `dynamic = 'force-dynamic'`
- ✅ `/contract-review/page.tsx` - Uses Zustand stores
- ✅ `/history/page.tsx` - Uses `useAuditLogsStore`
- ✅ `/upload-assets/page.tsx` - Uses `useAssetsStore`
- ✅ `/policy-generator/page.tsx` - Uses Zustand stores
- ✅ `/search/page.tsx` - Dynamic search with client-side state
- ✅ `/users/page.tsx` - Uses custom hooks with caching
- ✅ `/settings/page.tsx` - Uses `useUserStore`
- ✅ `/profile/page.tsx` - Uses `useUserStore` and `useCompanyStore`
- ✅ `/dashboard/page.tsx` - Uses Zustand stores for analytics
- ✅ `/compliance-check/page.tsx` - Uses multiple Zustand stores
- ✅ `/chat-history/page.tsx` - Uses TanStack Query `useChatHistory` hook
- ✅ `/ai-agents/page.tsx` - Client-side AI agent management

### Auth Pages
- ✅ `/auth/signup/page.tsx` - Authentication page
- ✅ `/auth/signin/page.tsx` - Authentication page
- ✅ `/org-list/page.tsx` - Organization selection

## Files That Still Use `revalidate` (Server Components)
These are **Server Components** and correctly use ISR:

- ✅ `/page.tsx` (root) - `revalidate = 3600` (1 hour) - Static redirect
- ✅ `/statistics/page.tsx` - `revalidate = 300` (5 minutes)
- ✅ `/knowledge-base/page.tsx` - `revalidate = 300` (5 minutes)

## Caching Strategy Summary

### Server Components (ISR)
- Use `export const revalidate = <seconds>`
- Data is cached at build time and revalidated on the server
- Good for: Static pages, rarely changing content

### Client Components (TanStack Query + Zustand)
- Use TanStack Query for data fetching with automatic caching
- Use Zustand stores for global state management
- Good for: Interactive pages, real-time data, user input

## TanStack Query Caching Benefits
All client components benefit from TanStack Query's built-in features:

```typescript
// Default configuration from query-provider.tsx
{
  staleTime: 5 * 60 * 1000,     // 5 minutes before data is stale
  gcTime: 10 * 60 * 1000,       // 10 minutes before garbage collection
  retry: 1,                      // Retry failed requests once
  refetchOnWindowFocus: false,   // Don't refetch on tab focus
}
```

### Available Utilities
- `useOptimisticMutation` - Instant UI updates before API calls
- `useOptimisticUpdate` - Direct cache updates
- `usePrefetch` - Preload data on hover/click
- `useInvalidateQueries` - Force data refresh
- Query keys factory for type-safe cache management

## Testing
After these fixes:
1. ✅ Build completes successfully (`npm run build`)
2. ✅ Dev server runs without errors (`npm run dev`)
3. ✅ All pages load correctly
4. ✅ React Query DevTools available in development

## Documentation
- See `TANSTACK_QUERY_GUIDE.md` for complete TanStack Query implementation
- See `CACHING_IMPLEMENTATION.md` for ISR caching strategy
- See `TANSTACK_QUERY_CHEATSHEET.md` for quick reference

## Best Practices Going Forward

### When to Use Server Components with ISR
- Static content pages
- Marketing pages
- Documentation
- Content that changes infrequently

### When to Use Client Components with TanStack Query
- Pages with user interactions
- Real-time data
- Forms and input fields
- Pages using React hooks
- Dynamic filtering/sorting

### Rule of Thumb
**If you see `"use client"` at the top, do NOT use `export const revalidate`**

Instead, rely on:
- TanStack Query for data fetching
- Zustand stores for state management
- Custom hooks with built-in caching
