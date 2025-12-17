"use client";
import { ReactNode } from "react";
import { usePlan } from "@/lib/usePlan";
import { type Plan } from "@/lib/plans";
import { PlanUpgradeMessage } from "./PlanUpgradeMessage";

interface PlanGuardProps {
  children: ReactNode;
  requiredPlan: Plan;
  fallback?: ReactNode;
  showUpgradeMessage?: boolean;
  featureName?: string;
  upgradeLink?: string;
}

/**
 * Client-side plan guard component
 * Usage: Wrap your page content with <PlanGuard requiredPlan="pro">...</PlanGuard>
 * 
 * @example
 * <PlanGuard requiredPlan="pro" showUpgradeMessage featureName="این قابلیت">
 *   <ProFeature />
 * </PlanGuard>
 */
export function PlanGuard({
  children,
  requiredPlan,
  fallback,
  showUpgradeMessage = false,
  featureName,
  upgradeLink,
}: PlanGuardProps) {
  const { hasPlanAccess, loading } = usePlan();

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasPlanAccess(requiredPlan)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradeMessage) {
      return (
        <div className="xl:p-4 mt-20 xl:mt-0">
          <PlanUpgradeMessage
            requiredPlan={requiredPlan}
            featureName={featureName}
            upgradeLink={upgradeLink}
          />
        </div>
      );
    }

    return null;
  }

  return <>{children}</>;
}

