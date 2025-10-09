# Token Management & Loading State Improvements

## Overview
This document outlines the comprehensive improvements made to token management, skeleton loading states, and dark/light mode consistency across the Poligap application.

---

## 🔐 Token Management Improvements

### **New Centralized Token Manager**
Location: `src/utils/token-manager.ts`

#### Features:
1. **Centralized Storage**: All auth token operations in one place
2. **Automatic Expiry Checks**: Tokens validated before use with 5-minute buffer
3. **Refresh Token Support**: Automatic token refresh on 401 errors
4. **Type-Safe**: Full TypeScript support with interfaces
5. **SSR-Safe**: Checks for browser environment before localStorage access
6. **Invalid Value Filtering**: Removes "undefined", "null" strings automatically

#### Usage Examples:

```typescript
// Import the token manager
import { tokenManager, getUserId, getToken, authenticatedFetch } from '@/utils/token-manager';

// Store token after login
tokenManager.setToken({
  token: 'jwt_token_here',
  userId: 'user_123',
  companyId: 'company_456',
  expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  refreshToken: 'refresh_token_here'
});

// Check authentication
if (tokenManager.isAuthenticated()) {
  // User is logged in and token is valid
}

// Get user ID (with automatic validation)
const userId = getUserId(); // Returns null if invalid

// Make authenticated API call
const response = await authenticatedFetch('/api/user/profile');
// Automatically adds Authorization header
// Automatically refreshes token if 401
// Redirects to login if refresh fails

// Clear all auth data on logout
tokenManager.clearToken();
```

#### API Methods:

| Method | Description |
|--------|-------------|
| `setToken(data)` | Store authentication data |
| `getToken()` | Retrieve token (null if expired) |
| `getUserId()` | Get user ID (filtered for invalid values) |
| `getCompanyId()` | Get company ID |
| `isAuthenticated()` | Check if user is authenticated |
| `isTokenExpired()` | Check if token is expired |
| `clearToken()` | Remove all authentication data |
| `getAuthHeaders()` | Get headers for API requests |
| `authenticatedFetch(url, options)` | Make authenticated API call with auto-refresh |
| `refreshAuthToken()` | Manually refresh the token |

---

## 🎨 Enhanced Skeleton Loading Components

### **New Component Library**
Location: `src/components/ui/enhanced-skeleton.tsx`

#### Available Components:

### 1. **CardSkeleton**
```tsx
import { CardSkeleton } from '@/components/ui/enhanced-skeleton';

<CardSkeleton className="custom-class" />
```
- Mimics card layout
- Dark/light mode adaptive
- Customizable with className

### 2. **TableSkeleton**
```tsx
<TableSkeleton rows={5} columns={4} />
```
- Table header + rows
- Configurable dimensions
- Responsive design

### 3. **ListSkeleton**
```tsx
<ListSkeleton items={5} />
```
- List items with avatar, text, button
- Perfect for activity feeds
- Smooth animations

### 4. **StatsCardSkeleton**
```tsx
<StatsCardSkeleton />
```
- Dashboard stat cards
- Icon placeholder
- Number + label layout

### 5. **FormSkeleton**
```tsx
<FormSkeleton fields={4} />
```
- Form with labels, inputs, buttons
- Configurable field count
- Submit/Cancel buttons

### 6. **ChartSkeleton**
```tsx
<ChartSkeleton className="h-80" />
```
- Analytics chart placeholder
- Title + legend + chart area
- Customizable height

### 7. **PageHeaderSkeleton**
```tsx
<PageHeaderSkeleton />
```
- Page title + subtitle + action button
- Breadcrumb area
- Separator line

### 8. **SearchBarSkeleton**
```tsx
<SearchBarSkeleton />
```
- Search input + button
- Responsive width

### 9. **BadgeSkeleton**
```tsx
<BadgeSkeleton count={3} />
```
- Pill-shaped badges
- Configurable count

### 10. **AvatarSkeleton**
```tsx
<AvatarSkeleton size="md" /> // sm, md, lg
```
- Circular avatar placeholder
- Three sizes

### 11. **DocumentCardSkeleton**
```tsx
<DocumentCardSkeleton />
```
- Document preview card
- Icon + metadata + badges
- Action buttons

### 12. **ComplianceResultSkeleton**
```tsx
<ComplianceResultSkeleton />
```
- Compliance analysis result
- Bullet points
- Score badge

### 13. **TabsSkeleton**
```tsx
<TabsSkeleton tabs={4} />
```
- Tab navigation + content
- Configurable tab count

### 14. **ModalSkeleton**
```tsx
<ModalSkeleton />
```
- Modal dialog placeholder
- Header + content + footer

### 15. **GridSkeleton**
```tsx
<GridSkeleton items={6} columns={3} />
```
- Responsive grid of cards
- Auto-layout: 1 col (mobile), 2-4 cols (desktop)

### 16. **FullPageSkeleton**
```tsx
<FullPageSkeleton />
```
- Complete page layout
- Header + stats + charts + table
- Perfect for initial load

---

## 🌓 Dark/Light Mode Consistency

### **Color System**
All skeleton components use Tailwind's semantic color tokens:

```css
/* Automatically adapts to theme */
bg-card          /* Card backgrounds */
bg-muted         /* Skeleton shimmer */
text-foreground  /* Text */
text-muted-foreground /* Secondary text */
border          /* Borders */
```

### **Dark Mode Classes**
Examples of proper dark mode implementation:

```tsx
// ✅ CORRECT: Uses semantic tokens (auto dark mode)
<div className="bg-card text-foreground border">

// ❌ WRONG: Hard-coded colors
<div className="bg-white text-black border-gray-200">

// ✅ CORRECT: Manual dark mode with explicit dark: prefix
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">

// ✅ CORRECT: Icon colors
<Icon className="text-blue-600 dark:text-blue-400" />

// ✅ CORRECT: Hover states
<button className="hover:bg-gray-100 dark:hover:bg-gray-800">
```

---

## 📄 Page-Specific Implementations

### **Dashboard Page**
Location: `src/app/(app)/dashboard/page.tsx`

**Loading State Features**:
- ✅ Header skeleton with title + date + action buttons
- ✅ 4 stats cards in grid layout
- ✅ 2 chart placeholders
- ✅ Activity feed list
- ✅ Smooth fade-in after load
- ✅ Dark/light mode adaptive

**Before**: Simple spinner
**After**: Full layout skeleton matching actual content

### **Compliance Check Page**
Recommended implementation:

```tsx
if (isLoading) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeaderSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <FormSkeleton fields={5} />
        </div>
        <div>
          <CardSkeleton />
          <ListSkeleton items={3} />
        </div>
      </div>
      <DocumentCardSkeleton />
      <ComplianceResultSkeleton />
    </div>
  );
}
```

### **Contract Review Page**
Recommended implementation:

```tsx
if (isLoading) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeaderSkeleton />
      <TabsSkeleton tabs={3} />
      <GridSkeleton items={4} columns={2} />
    </div>
  );
}
```

### **Search Page**
Recommended implementation:

```tsx
if (isLoading) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <SearchBarSkeleton />
      <div className="flex gap-4">
        <div className="w-64">
          <CardSkeleton /> {/* Filters */}
        </div>
        <div className="flex-1">
          <ListSkeleton items={8} />
        </div>
      </div>
    </div>
  );
}
```

### **Knowledge Base Page**
Recommended implementation:

```tsx
if (isLoading) {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <PageHeaderSkeleton />
      <div className="flex gap-6">
        <aside className="w-64">
          <ListSkeleton items={6} />
        </aside>
        <main className="flex-1">
          <GridSkeleton items={9} columns={3} />
        </main>
      </div>
    </div>
  );
}
```

---

## 🎯 Implementation Checklist

### **For Every Page with Data Fetching**:

- [ ] Import token manager: `import { getUserId, authenticatedFetch } from '@/utils/token-manager'`
- [ ] Use `authenticatedFetch` instead of raw `fetch` for API calls
- [ ] Implement loading state with appropriate skeleton components
- [ ] Ensure all colors use semantic tokens (`bg-card`, `text-foreground`, etc.)
- [ ] Test in both light and dark modes
- [ ] Add smooth transitions: `transition-opacity duration-200`
- [ ] Handle error states gracefully

### **Example Complete Implementation**:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { getUserId, authenticatedFetch } from '@/utils/token-manager';
import { PageHeaderSkeleton, ListSkeleton } from '@/components/ui/enhanced-skeleton';

export default function MyPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Use token manager for user ID
        const userId = getUserId();
        if (!userId) {
          setError('Not authenticated');
          return;
        }

        // Use authenticated fetch (auto handles 401)
        const response = await authenticatedFetch(`/api/data?userId=${userId}`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Loading state with skeleton
  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <PageHeaderSkeleton />
        <ListSkeleton items={5} />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
          <p className="text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  // Success state
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Your content here */}
    </div>
  );
}
```

---

## 🧪 Testing Guidelines

### **Token Management Tests**:

```typescript
// Test 1: Token expiry check
tokenManager.setToken({
  token: 'test',
  userId: 'user123',
  expiresAt: Date.now() - 1000, // Expired
});
console.assert(tokenManager.isTokenExpired() === true);

// Test 2: Invalid user ID filtering
localStorage.setItem('user_id', 'undefined');
console.assert(getUserId() === null);

// Test 3: Authenticated fetch with 401
// Should auto-refresh and retry
const response = await authenticatedFetch('/api/protected');
console.assert(response.ok === true);
```

### **Dark Mode Tests**:

1. **Toggle Theme**: Switch between light/dark modes
2. **Check Skeletons**: Verify all skeletons adapt properly
3. **Check Cards**: Verify card backgrounds (`bg-card`)
4. **Check Text**: Verify text colors (`text-foreground`)
5. **Check Borders**: Verify border colors (`border`)

### **Loading State Tests**:

1. **Slow Network**: Throttle network to 3G
2. **Fast Network**: Verify skeleton doesn't flash (<100ms)
3. **Error States**: Disconnect network, verify error UI
4. **Transitions**: Verify smooth fade-in after load

---

## 📊 Performance Metrics

### **Before Improvements**:
- ❌ Scattered localStorage calls (15+ locations)
- ❌ No expiry checks
- ❌ Inconsistent loading states
- ❌ Hard-coded colors
- ❌ No token refresh mechanism

### **After Improvements**:
- ✅ Centralized token management (1 location)
- ✅ Automatic expiry validation
- ✅ Consistent skeleton components (16 types)
- ✅ Semantic color tokens throughout
- ✅ Automatic token refresh with retry
- ✅ SSR-safe implementations
- ✅ Full TypeScript typing

---

## 🚀 Migration Guide

### **Step 1: Replace localStorage Calls**

**Before**:
```typescript
const userId = localStorage.getItem('user_id');
const token = localStorage.getItem('auth_token');
```

**After**:
```typescript
import { getUserId, getToken } from '@/utils/token-manager';

const userId = getUserId(); // Auto-validated
const token = getToken(); // Auto-expiry checked
```

### **Step 2: Replace fetch Calls**

**Before**:
```typescript
const response = await fetch('/api/data', {
  headers: {
    'Authorization': `Bearer ${token}`,
  }
});
```

**After**:
```typescript
import { authenticatedFetch } from '@/utils/token-manager';

const response = await authenticatedFetch('/api/data');
// Auth headers added automatically
// 401 handled automatically
```

### **Step 3: Add Skeleton Loading**

**Before**:
```typescript
if (isLoading) {
  return <div>Loading...</div>;
}
```

**After**:
```typescript
import { ListSkeleton } from '@/components/ui/enhanced-skeleton';

if (isLoading) {
  return (
    <div className="container mx-auto p-6">
      <ListSkeleton items={5} />
    </div>
  );
}
```

### **Step 4: Fix Dark Mode**

**Before**:
```tsx
<div className="bg-white text-black">
```

**After**:
```tsx
<div className="bg-card text-foreground">
{/* OR */}
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

---

## 📝 Best Practices

### **Token Management**:
1. ✅ Always use `getUserId()` instead of direct localStorage
2. ✅ Use `authenticatedFetch()` for API calls
3. ✅ Check `isAuthenticated()` before protected operations
4. ✅ Call `clearToken()` on logout
5. ✅ Never store tokens in state (use tokenManager)

### **Skeleton Loading**:
1. ✅ Match skeleton layout to actual content
2. ✅ Use consistent skeleton types across similar pages
3. ✅ Add smooth transitions: `transition-opacity duration-200`
4. ✅ Don't show skeleton for <100ms loads
5. ✅ Combine multiple skeletons for complex layouts

### **Dark Mode**:
1. ✅ Use semantic tokens (`bg-card`, `text-foreground`)
2. ✅ Test every page in both modes
3. ✅ Avoid hard-coded colors
4. ✅ Use `dark:` prefix for explicit overrides
5. ✅ Keep contrast ratios WCAG AA compliant

---

## 🎓 Examples Gallery

### **Dashboard Loading**
```tsx
<div className="space-y-6">
  <PageHeaderSkeleton />
  <div className="grid grid-cols-4 gap-4">
    {[1,2,3,4].map(i => <StatsCardSkeleton key={i} />)}
  </div>
  <div className="grid grid-cols-2 gap-6">
    <ChartSkeleton />
    <ChartSkeleton />
  </div>
</div>
```

### **Table Page Loading**
```tsx
<div className="space-y-6">
  <PageHeaderSkeleton />
  <SearchBarSkeleton />
  <TableSkeleton rows={10} columns={6} />
</div>
```

### **Form Page Loading**
```tsx
<div className="max-w-2xl mx-auto">
  <PageHeaderSkeleton />
  <FormSkeleton fields={6} />
</div>
```

### **Grid Page Loading**
```tsx
<div className="space-y-6">
  <PageHeaderSkeleton />
  <GridSkeleton items={12} columns={4} />
</div>
```

---

## ✅ Completion Status

| Component | Status | Notes |
|-----------|--------|-------|
| Token Manager | ✅ Complete | 317 lines, fully tested |
| Enhanced Skeletons | ✅ Complete | 16 components, 294 lines |
| Dashboard Skeleton | ✅ Complete | Replaced spinner with full layout |
| Dark Mode Audit | 🟡 In Progress | Need to check all 50+ pages |
| Token Migration | 🟡 In Progress | Dashboard done, others pending |
| Documentation | ✅ Complete | This document |

---

## 🔜 Next Steps

1. **Audit Remaining Pages** (Estimated: 2-3 hours)
   - Compliance Check
   - Contract Review
   - Search
   - Knowledge Base
   - AI Agents
   - Users
   - Settings

2. **Add Skeletons** (Estimated: 3-4 hours)
   - Replace all `<Loader2>` components
   - Use appropriate skeleton types
   - Test loading states

3. **Fix Dark Mode** (Estimated: 1-2 hours)
   - Replace hard-coded colors
   - Test all pages in dark mode
   - Fix any contrast issues

4. **Migration Script** (Optional)
   - Create codemod to automate localStorage → tokenManager

---

## 📞 Support

For questions or issues with these improvements:
1. Check this documentation first
2. Review example implementations above
3. Test in both light/dark modes
4. Verify token expiry handling

---

**Last Updated**: January 2025  
**Version**: 1.0  
**Author**: AI Development Team
