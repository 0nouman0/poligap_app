# Component Selection Guide
**Last Updated:** January 22, 2025  
**Purpose:** Help developers choose the right component for their needs

---

## 🎯 Quick Reference

| Need | Use This | Don't Use |
|------|----------|-----------|
| Button | `ui/button.tsx` | ~~common/common-button.tsx~~ |
| Loading Spinner | `common/loading-spinner.tsx` | ~~knowledge-base LoadingSpinner~~ |
| Simple Dialog | `ui/dialog.tsx` | - |
| Dialog with Actions | `common/common-modal.tsx` | - |
| Confirmation Dialog | `modals/ConfirmDialog.tsx` | - |
| Input Field | `ui/input.tsx` | ~~common/text-input.tsx~~ (legacy) |
| Skeleton Loading | `ui/skeleton.tsx` or `ui/page-loader.tsx` | - |

---

## 📦 Component Details

### Buttons

#### ✅ `ui/button.tsx` (RECOMMENDED)
**When to use:** All new button implementations  
**Type:** Shadcn standard button component  
**Features:**
- Standard variants: `default`, `destructive`, `outline`, `secondary`, `ghost`, `link`
- Sizes: `default`, `sm`, `lg`, `icon`
- Built-in accessibility
- Consistent with design system

**Example:**
```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="lg">
  Save Changes
</Button>

// Icon button
<Button variant="ghost" size="icon">
  <Settings className="h-4 w-4" />
</Button>
```

#### ⚠️ `common/common-button.tsx` (DEPRECATED)
**Status:** Being phased out  
**Still used in:** 3 files (common-modal, InviteUserModal, ConfirmDialog)  
**Migration:** Update imports to `ui/button.tsx`

---

### Loading Indicators

#### ✅ `common/loading-spinner.tsx` (CURRENT STANDARD)
**When to use:** Need a Material-UI CircularProgress spinner  
**Features:**
- Proper TypeScript types
- Customizable size
- Custom animation

**Example:**
```tsx
import { LoadingSpinner } from "@/components/common/loading-spinner";

<LoadingSpinner size={24} />
```

#### 🚀 `Loader2` Icon (FUTURE STANDARD)
**When to use:** New implementations (preferred for Q1 2025 migration)  
**Why:** Eliminates Material-UI dependency

**Example:**
```tsx
import { Loader2 } from "lucide-react";

<Loader2 className="h-5 w-5 animate-spin" />
```

#### ❌ `knowledge-base/knowledge-loader/LoadingSpinner.tsx` (DON'T USE)
**Status:** Fixed but duplicate  
**Issue:** Was broken, now works but is redundant  
**Action:** Use `common/loading-spinner.tsx` instead

---

### Modals & Dialogs

#### ✅ `ui/dialog.tsx` (PRIMITIVE)
**When to use:** Need full control over dialog structure  
**Type:** Base Radix UI Dialog wrapper  
**Features:**
- Maximum flexibility
- Compose custom dialogs
- All Radix Dialog primitives exposed

**Example:**
```tsx
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Custom Dialog</DialogTitle>
      <DialogDescription>Build your own structure</DialogDescription>
    </DialogHeader>
    <div>Your custom content</div>
  </DialogContent>
</Dialog>
```

#### ✅ `common/common-modal.tsx` (CONVENIENCE WRAPPER)
**When to use:** Need a modal with action buttons  
**Type:** Pre-configured dialog with footer actions  
**Features:**
- Action buttons pattern
- Loading states
- Cancel button
- Simple API

**Example:**
```tsx
import { CommonModal } from "@/components/common/common-modal";

<CommonModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Save Changes?"
  description="Your changes will be permanently saved."
  actions={[
    {
      label: "Save",
      onClick: handleSave,
      variant: "default",
      loading: isSaving,
    }
  ]}
/>
```

#### ✅ `modals/ConfirmDialog.tsx` (SPECIALIZED)
**When to use:** Need confirmation for destructive actions  
**Type:** Specialized confirmation dialog  
**Features:**
- Checkbox acknowledgment
- Keyword confirmation (type "DELETE")
- Loading states
- Built for destructive actions

**Example:**
```tsx
import { ConfirmDialog } from "@/components/modals/ConfirmDialog";

<ConfirmDialog
  open={confirmOpen}
  title="Delete Account?"
  description="This action cannot be undone."
  confirmText="Delete Account"
  confirmVariant="destructive"
  onConfirm={handleDelete}
  onCancel={() => setConfirmOpen(false)}
  requireAcknowledge
  confirmKeyword="DELETE"
/>
```

**Decision Tree:**
```
Need a dialog?
├─ Need confirmation for dangerous action? → ConfirmDialog
├─ Need action buttons? → CommonModal
└─ Need full control? → ui/Dialog
```

---

### Input Fields

#### ✅ `ui/input.tsx` (RECOMMENDED)
**When to use:** All new input implementations  
**Type:** Shadcn standard input  
**Features:**
- Clean, minimal API
- Built-in aria-invalid support
- Consistent styling
- Works with React Hook Form

**Example:**
```tsx
import { Input } from "@/components/ui/input";

<Input
  type="email"
  placeholder="Enter email"
  aria-invalid={!!error}
/>
```

#### ⚠️ `common/text-input.tsx` (LEGACY)
**Status:** Still in use but overengineered  
**Used in:** ~12 files  
**Issues:**
- Too many props (fromSprint, fromSprintCreate, etc.)
- Uses Material-UI icons
- Custom CSS variables

**Migration plan:** Enhance `ui/input.tsx` with error states, then migrate

---

### Skeletons & Loaders

#### ✅ `ui/skeleton.tsx` (PRIMITIVE)
**When to use:** Simple skeleton boxes  
**Example:**
```tsx
import { Skeleton } from "@/components/ui/skeleton";

<Skeleton className="h-4 w-full" />
```

#### ✅ `ui/page-loader.tsx` (PRE-BUILT PATTERNS)
**When to use:** Need complete page skeleton patterns  
**Variants:** `PageLoader`, `FullPageLoader`, `DashboardSkeleton`, `ChatSkeleton`, `ListSkeleton`

**Example:**
```tsx
import { ChatSkeleton } from "@/components/ui/page-loader";

{isLoading && <ChatSkeleton />}
```

---

## 🚫 Components to Avoid

### ❌ DO NOT USE (Duplicates/Deprecated)

1. **`common/common-button.tsx`**
   - **Why:** Duplicate of ui/button.tsx
   - **Use instead:** `ui/button.tsx`

2. **`knowledge-base/knowledge-loader/LoadingSpinner.tsx`**
   - **Why:** Duplicate of common/loading-spinner.tsx
   - **Use instead:** `common/loading-spinner.tsx`

3. **`common/text-input.tsx`** (for new code)
   - **Why:** Overengineered, being replaced
   - **Use instead:** `ui/input.tsx`

---

## 🎨 Design System Adherence

### UI Framework Standard: **Shadcn UI + Radix UI**

**Prefer Shadcn components:**
- Built on Radix UI primitives
- Fully accessible (WCAG 2.1 AA)
- Consistent styling with Tailwind CSS
- Type-safe with TypeScript
- Customizable without fighting the framework

**Avoid Material-UI components:**
- **Current usage:** 13 components still use MUI
- **Migration plan:** Q1 2025 (see Migration Roadmap)
- **Why migrate:** -180KB bundle size, consistent styling

---

## 🏗️ Creating New Components

### Checklist for New Components:

- [ ] Use Shadcn/Radix primitives where possible
- [ ] Add proper TypeScript types
- [ ] Use named exports (not default)
- [ ] Add ARIA labels for icon-only buttons
- [ ] Add `data-slot` attributes for testing
- [ ] Use Tailwind CSS (not CSS-in-JS)
- [ ] Document usage in component file (JSDoc)
- [ ] Add to this guide if it solves a common need

### Template:
```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface ComponentNameProps {
  variant?: "default" | "secondary";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function ComponentName({ 
  variant = "default", 
  size = "md", 
  children,
  className,
  ...props 
}: ComponentNameProps & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="component-name"
      className={cn("base-styles", className)}
      {...props}
    >
      {children}
    </div>
  );
}
```

---

## 📚 Additional Resources

- **Component Audit Report:** `docs/reports/COMPONENT_USAGE_MAP.md`
- **Migration Roadmap:** `docs/guides/UI_MIGRATION_ROADMAP.md`
- **Shadcn Documentation:** https://ui.shadcn.com/
- **Radix UI Documentation:** https://www.radix-ui.com/

---

## ❓ FAQ

**Q: Why are there duplicate button components?**  
A: Rapid development led to parallel implementations. We're consolidating to `ui/button.tsx`.

**Q: Can I use Material-UI components?**  
A: Avoid for new code. We're migrating away from MUI to reduce bundle size and improve consistency.

**Q: How do I know if a component is deprecated?**  
A: Check this guide! Deprecated components are marked with ⚠️ or ❌.

**Q: What if I need a component that doesn't exist?**  
A: Check Shadcn UI library first. If not available, build with Radix primitives and Tailwind.

**Q: Should I use default or named exports?**  
A: Named exports (e.g., `export function Button()`) for all components.

---

**Need help choosing a component?** Ask in #engineering-help or refer to the Component Audit Report.
