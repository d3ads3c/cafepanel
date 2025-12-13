# Plan-Based Access Control Usage Examples

This document shows how to use the plan-based access control system in your application.

## Plans Hierarchy

- **basic** (Level 1) - Basic features
- **pro** (Level 2) - Includes all basic features + more
- **advance** (Level 3) - Includes all pro features + advanced features

## Server-Side Usage (API Routes)

### Check Plan in API Route

```typescript
// app/api/some-feature/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPlan, type Plan } from '@/lib/plans';

export async function GET(request: NextRequest) {
  const auth = await getEnhancedAuth(request);
  
  // Check if user has pro plan or higher
  if (!hasPlan(auth, 'pro')) {
    return NextResponse.json(
      { success: false, message: 'این قابلیت نیاز به پلن pro دارد' },
      { status: 403 }
    );
  }

  // User has access, proceed with feature
  return NextResponse.json({ success: true, data: {} });
}
```

### Protect Multiple Plans

```typescript
import { hasAnyPlan } from '@/lib/plans';

// Check if user has pro OR advance plan
if (!hasAnyPlan(auth?.plan, ['pro', 'advance'])) {
  return NextResponse.json({ error: 'Access denied' }, { status: 403 });
}
```

## Client-Side Usage (React Components)

### Using the PlanGuard Component

```tsx
// app/(panel)/advanced-features/page.tsx
"use client";
import { PlanGuard } from '@/components/PlanGuard';

export default function AdvancedFeaturesPage() {
  return (
    <PlanGuard requiredPlan="pro" showUpgradeMessage>
      <div>
        <h1>ویژگی‌های پیشرفته</h1>
        {/* This content only shows for pro/advance users */}
      </div>
    </PlanGuard>
  );
}
```

### Using the usePlan Hook

```tsx
// components/SomeFeature.tsx
"use client";
import { usePlan } from '@/lib/usePlan';

export function SomeFeature() {
  const { plan, hasPlanAccess, loading } = usePlan();

  if (loading) {
    return <div>در حال بارگذاری...</div>;
  }

  // Show feature only for pro users
  if (!hasPlanAccess('pro')) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p>این قابلیت برای پلن pro در دسترس است</p>
      </div>
    );
  }

  return (
    <div>
      <h2>ویژگی Pro</h2>
      {/* Pro feature content */}
    </div>
  );
}
```

### Conditional Rendering

```tsx
"use client";
import { usePlan } from '@/lib/usePlan';

export function FeatureList() {
  const { hasPlanAccess, hasExactPlan } = usePlan();

  return (
    <div>
      {/* Basic feature - available to all */}
      <BasicFeature />

      {/* Pro feature - only for pro/advance */}
      {hasPlanAccess('pro') && <ProFeature />}

      {/* Advance-only feature */}
      {hasPlanAccess('advance') && <AdvanceFeature />}

      {/* Exact plan check */}
      {hasExactPlan('pro') && <ProOnlyFeature />}
    </div>
  );
}
```

## Page-Level Protection

### Protect Entire Page

```tsx
// app/(panel)/accounting/page.tsx
import { redirect } from 'next/navigation';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPlan } from '@/lib/plans';

export default async function AccountingPage() {
  // This would need to be done in a server component
  // For now, use client-side protection with PlanGuard
  return (
    <div>
      <h1>حسابداری</h1>
      {/* Page content */}
    </div>
  );
}
```

### Using Middleware (Alternative Approach)

You can also protect routes at the middleware level by checking plans.

## Feature Flags Based on Plan

```tsx
"use client";
import { usePlan } from '@/lib/usePlan';

export function Dashboard() {
  const { hasPlanAccess } = usePlan();

  return (
    <div>
      <h1>داشبورد</h1>
      
      {/* Basic features */}
      <BasicStats />
      
      {/* Pro features */}
      {hasPlanAccess('pro') && (
        <>
          <AdvancedReports />
          <ExportData />
        </>
      )}
      
      {/* Advance features */}
      {hasPlanAccess('advance') && (
        <>
          <CustomIntegrations />
          <APIAccess />
        </>
      )}
    </div>
  );
}
```

## Sidebar/Menu Items

```tsx
// components/DesktopSidebar.tsx
"use client";
import { usePlan } from '@/lib/usePlan';

export function DesktopSidebar() {
  const { hasPlanAccess } = usePlan();

  return (
    <nav>
      <Link href="/dashboard">داشبورد</Link>
      <Link href="/orders">سفارشات</Link>
      
      {/* Only show for pro/advance */}
      {hasPlanAccess('pro') && (
        <Link href="/accounting">حسابداری</Link>
      )}
      
      {/* Only show for advance */}
      {hasPlanAccess('advance') && (
        <Link href="/advanced-settings">تنظیمات پیشرفته</Link>
      )}
    </nav>
  );
}
```

## Button/Feature Disabling

```tsx
"use client";
import { usePlan } from '@/lib/usePlan';

export function ExportButton() {
  const { hasPlanAccess } = usePlan();
  const isPro = hasPlanAccess('pro');

  return (
    <button
      disabled={!isPro}
      className={!isPro ? 'opacity-50 cursor-not-allowed' : ''}
      title={!isPro ? 'این قابلیت برای پلن pro در دسترس است' : ''}
    >
      خروجی Excel
    </button>
  );
}
```

## Notes

1. **Plan Hierarchy**: Higher plans automatically include lower plan features
   - `advance` users can access `pro` and `basic` features
   - `pro` users can access `basic` features

2. **Server vs Client**: 
   - Use `hasPlan()` from `@/lib/plans` in server components/API routes
   - Use `usePlan()` hook in client components

3. **Performance**: The `usePlan` hook fetches user info once and caches it

4. **Fallbacks**: Always provide fallback UI for users without access

