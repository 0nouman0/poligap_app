# UI Component Migration Roadmap
**Date:** January 22, 2025  
**Status:** 🔄 In Progress  
**Goal:** Clean, consistent, maintainable component architecture

---

## ✅ Phase 1: Non-Destructive Cleanup (COMPLETED)

### Completed Tasks:
- ✅ Component usage audit (56 ui/button vs 3 common-button)
- ✅ Removed 6 backup files
- ✅ Fixed broken LoadingSpinner CSS import
- ✅ Added TypeScript types to 2 components
- ✅ Removed 40+ console.log statements from main pages
- ✅ Added ARIA labels to modal/dialog close buttons
- ✅ Standardized exports for 3 common components
- ✅ Created component selection guide
- ✅ Added ESLint rules (no-console, no-debugger)

### Impact:
- Cleaner codebase
- Better type safety
- Improved accessibility
- Automated quality checks

---

## ✅ Phase 2: Button Consolidation (COMPLETED)

### Goal: Single button component standard

### Final State:
- `ui/button.tsx`: 59 files ✅ (ALL)
- `common/common-button.tsx`: DELETED ✅

### Files Migrated:
1. ✅ `src/components/common/common-modal.tsx` (already done)
2. ✅ `src/components/modals/InviteUserModal.tsx` (already done)
3. ✅ `src/components/modals/ConfirmDialog.tsx` (already done)
4. ✅ `src/app/(app)/chat/components/ChatInput/SelectLanguageButton.tsx`
5. ✅ `src/app/(app)/chat/components/ChatInput/LlmButton.tsx`
6. ✅ `src/app/(app)/users/page.tsx`

### Migration Steps:

#### Step 1: Update common-modal.tsx
```tsx
// Before
import { Button } from "@/components/ui/button";

// Already done! common-modal.tsx uses ui/button
```

#### Step 2: Update InviteUserModal.tsx
**File:** `src/components/modals/InviteUserModal.tsx`

**Find:**
```tsx
import { Button } from "@/components/common/common-button";
```

**Replace with:**
```tsx
import { Button } from "@/components/ui/button";
```

**Update button usage:**
- `variant="primary"` → `variant="default"`
- If using `prefixIcon`/`suffixIcon`, refactor:
```tsx
// Before
<Button prefixIcon={<Icon />} variant="primary">
  Text
</Button>

// After
<Button variant="default">
  <Icon className="mr-2 h-4 w-4" />
  Text
</Button>
```

#### Step 3: Update ConfirmDialog.tsx
**File:** `src/components/modals/ConfirmDialog.tsx`

Same process as Step 2.

#### Step 4: Delete common-button.tsx
**After all imports updated:**
```bash
rm src/components/common/common-button.tsx
```

#### Step 5: Verify
```bash
npm run build
npm run lint
```

### Success Criteria:
- ✅ All files use `ui/button.tsx`
- ✅ No imports from `common/common-button.tsx`
- ✅ Build passes
- ✅ No runtime errors

### Time Estimate: 2 hours

---

## 🎨 Phase 3: Material-UI Removal (Week 2-3)

### Goal: Single UI framework (Shadcn + Lucide icons)

### Current MUI Usage:
1. `common/loading-spinner.tsx` - CircularProgress
2. `knowledge-base/knowledge-loader/LoadingSpinner.tsx` - CircularProgress
3. `knowledge-base/kb-components/TertiaryButton.tsx` - Button, styled
4. `common/text-input.tsx` - CheckCircleOutlineRounded icon
5. `knowledge-base/knowledge-loader/CircularProgressWithLabel.tsx`
6. `knowledge-base/knowledge-loader/LinearProgressComponent.tsx`
7. Multiple knowledge-base components

### Migration Strategy:

#### 3.1: Replace LoadingSpinners
**Replace with Lucide Loader2:**

```tsx
// Before
import { LoadingSpinner } from "@/components/common/loading-spinner";
<LoadingSpinner size={24} />

// After
import { Loader2 } from "lucide-react";
<Loader2 className="h-6 w-6 animate-spin text-primary" />
```

**Files to update:** ~15 files

#### 3.2: Replace TertiaryButton
**Create shadcn variant:**

Add to `ui/button.tsx`:
```tsx
tertiary: "bg-transparent hover:bg-secondary text-foreground"
```

Then replace:
```tsx
// Before
import TertiaryButton from "@/components/knowledge-base/kb-components/TertiaryButton";

// After
import { Button } from "@/components/ui/button";
<Button variant="tertiary">
```

#### 3.3: Replace MUI Icons
**Use Lucide icons:**

```tsx
// Before
import { CheckCircleOutlineRounded } from "@mui/icons-material";
<CheckCircleOutlineRounded />

// After
import { CheckCircle } from "lucide-react";
<CheckCircle className="h-4 w-4" />
```

#### 3.4: Replace Progress Components
**Use shadcn Progress:**

```tsx
// Before
import { CircularProgress } from "@mui/material";

// After
import { Progress } from "@/components/ui/progress";
<Progress value={percentage} />
```

#### 3.5: Remove MUI Dependencies
**After all components migrated:**
```bash
npm uninstall @mui/material @mui/icons-material @emotion/react @emotion/styled
npm run build
```

### Success Criteria:
- ✅ Zero MUI imports
- ✅ Bundle size reduced by ~180KB
- ✅ Consistent animations/theming
- ✅ All tests pass

### Time Estimate: 40 hours (1 week)

---

## 📁 Phase 4: Directory Reorganization (Week 4)

### Goal: Logical component organization

### Current Structure Problems:
- 15+ root-level component files
- Unclear `common/` criteria
- Feature components scattered

### Proposed Structure:
```
src/components/
├── ui/                    # Design system primitives (shadcn)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── input.tsx
│   └── ...
├── shared/                # Truly shared across features
│   ├── page-loader.tsx
│   ├── error-boundary.tsx
│   └── ...
├── layout/                # Layout components
│   ├── app-sidebar.tsx
│   ├── header.tsx
│   └── ...
├── features/              # Feature-specific components
│   ├── compliance/
│   │   └── compliance-components.tsx
│   ├── contract-review/
│   │   ├── AIAnalysisPanel.tsx
│   │   ├── ContractCanvas.tsx
│   │   └── ...
│   ├── chat/
│   │   └── chat-components.tsx
│   ├── knowledge-base/
│   │   └── kb-components/
│   └── search/
│       └── search-components.tsx
└── providers/             # Context providers
    ├── theme-provider.tsx
    ├── query-provider.tsx
    └── ...
```

### Migration Steps:

#### Step 1: Create New Directories
```bash
mkdir -p src/components/shared
mkdir -p src/components/layout
mkdir -p src/components/features/compliance
mkdir -p src/components/features/contract-review
mkdir -p src/components/features/chat
mkdir -p src/components/providers
```

#### Step 2: Move Components (Do in batches of 5-10)
```bash
# Layout components
mv src/components/app-sidebar.tsx src/components/layout/
mv src/components/header.tsx src/components/layout/

# Providers
mv src/components/theme-provider.tsx src/components/providers/
mv src/components/QueryProvider.tsx src/components/providers/

# Shared utilities
mv src/components/ui/page-loader.tsx src/components/shared/
```

#### Step 3: Update Imports (Use find/replace)
```bash
# Example for app-sidebar
find src -type f \( -name "*.tsx" -o -name "*.ts" \) -exec sed -i '' 's|@/components/app-sidebar|@/components/layout/app-sidebar|g' {} +
```

#### Step 4: Delete old `common/` directory
```bash
rm -rf src/components/common
```

#### Step 5: Update WARP.md documentation

### Success Criteria:
- ✅ Logical grouping
- ✅ Easy to find components
- ✅ No broken imports
- ✅ Build passes

### Time Estimate: 16 hours (2 days)

---

## 🧹 Phase 5: Input Component Consolidation (Week 5)

### Goal: Single input component

### Current State:
- `ui/input.tsx`: 30 files ✅
- `common/text-input.tsx`: 12 files ⚠️

### Strategy:

#### Step 1: Enhance ui/input.tsx
Add error state support:
```tsx
// Add to ui/input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  errorMessage?: string;
}

export function Input({ error, errorMessage, className, ...props }: InputProps) {
  return (
    <div className="w-full">
      <input
        className={cn(
          "...",
          error && "border-destructive",
          className
        )}
        aria-invalid={error}
        {...props}
      />
      {error && errorMessage && (
        <p className="mt-1 text-xs text-destructive">{errorMessage}</p>
      )}
    </div>
  );
}
```

#### Step 2: Create FormInput wrapper
```tsx
// src/components/shared/form-input.tsx
export function FormInput({ label, ...props }: InputProps & { label?: string }) {
  return (
    <div>
      {label && <Label>{label}</Label>}
      <Input {...props} />
    </div>
  );
}
```

#### Step 3: Migrate 12 files
Replace `text-input.tsx` imports one by one, test each.

#### Step 4: Delete text-input.tsx
```bash
rm src/components/common/text-input.tsx
```

### Time Estimate: 12 hours (1.5 days)

---

## 🎯 Phase 6: Accessibility Audit (Week 6)

### Goal: WCAG 2.1 AA compliance

### Tasks:

#### 6.1: ARIA Labels
- [ ] Add aria-label to all icon-only buttons
- [ ] Add aria-describedby to form inputs with errors
- [ ] Add role attributes where needed

#### 6.2: Keyboard Navigation
- [ ] Test tab order on all pages
- [ ] Add focus indicators
- [ ] Trap focus in modals

#### 6.3: Screen Reader Testing
- [ ] Test with VoiceOver (macOS)
- [ ] Verify all interactive elements announced
- [ ] Check form validation messages

#### 6.4: Color Contrast
- [ ] Run automated contrast checker
- [ ] Fix any violations
- [ ] Add dark mode contrast tests

### Tools:
- axe DevTools extension
- Lighthouse accessibility audit
- WAVE browser extension

### Time Estimate: 16 hours (2 days)

---

## 📊 Phase 7: Performance Optimization (Week 7)

### Goals:
- Faster load times
- Better Core Web Vitals
- Smaller bundle

### Tasks:

#### 7.1: Code Splitting
```tsx
// Lazy load heavy components
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

#### 7.2: Image Optimization
- Use next/image for all images
- Add proper width/height
- Use WebP format

#### 7.3: Bundle Analysis
```bash
npm run build
npx @next/bundle-analyzer
```

#### 7.4: Remove Unused Code
- Run `npx depcheck`
- Remove unused dependencies
- Tree-shake large libraries

### Success Metrics:
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Bundle size < 200KB (gzipped)

### Time Estimate: 20 hours (2.5 days)

---

## 📝 Phase 8: Documentation & Onboarding (Week 8)

### Tasks:

#### 8.1: Component Documentation
- [ ] Add JSDoc to all components
- [ ] Create usage examples
- [ ] Document props and variants

#### 8.2: Storybook Setup
```bash
npx storybook@latest init
```

- [ ] Create stories for all ui components
- [ ] Add interaction tests
- [ ] Document best practices

#### 8.3: Developer Guide
- [ ] Update WARP.md
- [ ] Create architecture diagrams
- [ ] Document patterns and conventions
- [ ] Add troubleshooting guide

#### 8.4: Onboarding Checklist
Create checklist for new developers:
- [ ] Setup instructions
- [ ] Code style guide
- [ ] Component selection guide
- [ ] Common pitfalls

### Time Estimate: 24 hours (3 days)

---

## 📅 Complete Timeline

| Phase | Duration | Effort | Status |
|-------|----------|--------|--------|
| Phase 1: Non-Destructive | 2-3 days | 17h | ✅ DONE |
| Phase 2: Button Migration | 30 min | 0.5h | ✅ DONE |
| Phase 3: MUI Removal | 1 week | 40h | ⏳ Planned |
| Phase 4: Directory Reorg | 2 days | 16h | ⏳ Planned |
| Phase 5: Input Migration | 1.5 days | 12h | ⏳ Planned |
| Phase 6: Accessibility | 2 days | 16h | ⏳ Planned |
| Phase 7: Performance | 2.5 days | 20h | ⏳ Planned |
| Phase 8: Documentation | 3 days | 24h | ⏳ Planned |
| **TOTAL** | **6 weeks** | **145.5h** | **~20% Complete** |

---

## 🚀 Quick Start Guide

### For Immediate Next Steps:

**Today (30 min):**
1. Read Component Selection Guide
2. Review this roadmap
3. Set up calendar blocks for migration work

**This Week (2h):**
1. Execute Phase 2 (Button Migration)
2. Test thoroughly
3. Deploy to staging

**This Month:**
1. Complete Phases 3-5
2. Major cleanup done
3. Celebrate progress! 🎉

---

## 🆘 Rollback Plan

### If Something Breaks:

**For Button Migration:**
```bash
git revert <commit-hash>
# Redeploy previous version
```

**For MUI Removal:**
```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
# Restore previous imports
```

**General:**
- All changes are in git
- Can roll back individual files
- Staging environment for testing
- Feature flags for gradual rollout

---

## ✅ Definition of Done

### Each Phase Complete When:
- [ ] All code changes committed
- [ ] Build passes (`npm run build`)
- [ ] Lint passes (`npm run lint`)
- [ ] Manual testing completed
- [ ] No console errors
- [ ] Documentation updated
- [ ] Team reviewed
- [ ] Deployed to staging
- [ ] Smoke tests pass

---

## 📈 Success Metrics

### Technical Metrics:
- Bundle size: -180KB (MUI removal)
- Build time: -20% (fewer dependencies)
- Type coverage: 100%
- ESLint errors: 0
- Accessibility score: 90+

### Developer Experience:
- Time to find component: < 30 seconds
- Onboarding time: < 2 hours
- Code review time: -30%
- Bug rate: -40%

### User Experience:
- Page load time: -25%
- First contentful paint: < 1.5s
- Time to interactive: < 3s
- Accessibility complaints: 0

---

## 🎯 Priority Order

**If time is limited, focus on:**

1. **Phase 2 (Button)** - Low risk, high consistency gain
2. **Phase 3 (MUI)** - High impact on bundle size
3. **Phase 6 (Accessibility)** - Legal compliance
4. **Phase 4 (Directory)** - Developer experience
5. **Phase 5-8** - Nice to have

---

## 📞 Need Help?

**Questions?** Check:
1. Component Selection Guide
2. This roadmap
3. Ask in #engineering-help

**Found an issue?** 
1. Check rollback plan
2. Revert if blocking
3. Document for next iteration

---

**Remember:** Progress > Perfection. Better to ship Phase 2-3 well than rush all phases poorly.

**Last Updated:** January 22, 2025  
**Next Review:** February 1, 2025
