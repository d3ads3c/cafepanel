# Plan-Based Access Control Components Usage

This guide shows how to use the plan-based access control components to show upgrade messages when users don't have the required plan.

## Components Available

1. **PlanUpgradeMessage** - Standalone upgrade message component
2. **PlanProtectedPage** - Full page wrapper that checks permission + plan
3. **PlanCheck** - Inline component for conditional content
4. **PlanGuard** - Updated to use PlanUpgradeMessage

## 1. PlanUpgradeMessage (Standalone)

Use this component directly in your pages when you want to show an upgrade message.

```tsx
import { PlanUpgradeMessage } from '@/components/PlanUpgradeMessage';

// In your page
<PlanUpgradeMessage
  requiredPlan="pro"
  featureName="حسابداری"
  upgradeLink="/change-plan"
/>
```

## 2. PlanProtectedPage (Full Page Protection)

Wrap your entire page content to automatically check permission and plan.

```tsx
// app/(panel)/accounting/page.tsx
"use client";
import { PlanProtectedPage } from '@/components/PlanProtectedPage';

export default function AccountingPage() {
  return (
    <PlanProtectedPage
      requiredPermission="manage_accounting"
      featureName="حسابداری"
      upgradeLink="/change-plan"
    >
      <div>
        <h1>صفحه حسابداری</h1>
        {/* Your accounting content */}
      </div>
    </PlanProtectedPage>
  );
}
```

## 3. PlanCheck (Inline Conditional)

Use this for conditional sections within a page.

```tsx
// app/(panel)/dashboard/page.tsx
"use client";
import { PlanCheck } from '@/components/PlanCheck';

export default function DashboardPage() {
  return (
    <div>
      <h1>داشبورد</h1>
      
      {/* Basic content - always visible */}
      <BasicStats />
      
      {/* Accounting section - requires pro plan */}
      <PlanCheck
        requiredPermission="manage_accounting"
        featureName="حسابداری"
      >
        <AccountingSection />
      </PlanCheck>
      
      {/* Settings section - requires advance plan */}
      <PlanCheck
        requiredPermission="manage_users"
        featureName="تنظیمات پیشرفته"
      >
        <AdvancedSettings />
      </PlanCheck>
    </div>
  );
}
```

## 4. PlanGuard (Plan-Only Check)

Use this when you only need to check plan (not permission).

```tsx
import { PlanGuard } from '@/components/PlanGuard';

<PlanGuard
  requiredPlan="pro"
  showUpgradeMessage
  featureName="این قابلیت"
>
  <ProFeature />
</PlanGuard>
```

## Example: Updating Dashboard Page

Replace the existing upgrade message with PlanCheck:

```tsx
// Before
{hasAccess ? (
  <BuyListContent />
) : (
  <div className="bg-teal-600 text-white p-5 w-full rounded-2xl text-center">
    <h2>ارتقای پلن</h2>
    <p className="text-xs font-light">
      لیست خرید تنها در پلن حرفه ای و پیشرفته قابل استفاده است.
    </p>
    <div className="mt-4">
      <Link href={"/change-plan"} className="bg-white text-teal-600 rounded-2xl py-3 w-full">
        همین حالا ارتقا بده
      </Link>
    </div>
  </div>
)}

// After
<PlanCheck
  requiredPermission="manage_buylist"
  featureName="لیست خرید"
  upgradeLink="/change-plan"
>
  <BuyListContent />
</PlanCheck>
```

## Example: Protecting Entire Page

```tsx
// app/(panel)/accounting/invoices/page.tsx
"use client";
import { PlanProtectedPage } from '@/components/PlanProtectedPage';

export default function InvoicesPage() {
  return (
    <PlanProtectedPage
      requiredPermission="manage_accounting"
      featureName="فاکتورها"
    >
      {/* Your invoices page content */}
      <div>
        <h1>فاکتورها</h1>
        {/* ... */}
      </div>
    </PlanProtectedPage>
  );
}
```

## Example: Multiple Sections in One Page

```tsx
// app/(panel)/settings/page.tsx
"use client";
import { PlanCheck } from '@/components/PlanCheck';

export default function SettingsPage() {
  return (
    <div>
      <h1>تنظیمات</h1>
      
      {/* Basic settings - always visible */}
      <BasicSettings />
      
      {/* Categories - requires pro */}
      <PlanCheck
        requiredPermission="manage_categories"
        featureName="دسته‌بندی‌ها"
      >
        <CategoriesSection />
      </PlanCheck>
      
      {/* Users - requires advance */}
      <PlanCheck
        requiredPermission="manage_users"
        featureName="مدیریت کاربران"
      >
        <UsersSection />
      </PlanCheck>
    </div>
  );
}
```

## Notes

- **PlanProtectedPage**: Checks both permission AND plan, shows upgrade message if plan is insufficient
- **PlanCheck**: Inline component for conditional sections
- **PlanGuard**: Plan-only check (use when permission is already verified)
- **PlanUpgradeMessage**: Standalone message component

All components automatically:
- Fetch user plan and permissions
- Show loading state
- Display appropriate error/upgrade messages
- Handle both permission and plan requirements

