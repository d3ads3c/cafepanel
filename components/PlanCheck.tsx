"use client";
import { ReactNode } from "react";
import { usePlan } from "@/lib/usePlan";
import { getRequiredPlanForPermission, type Permission } from "@/lib/permissions";
import { PlanUpgradeMessage } from "./PlanUpgradeMessage";
import { useState, useEffect } from "react";

interface PlanCheckProps {
  children: ReactNode;
  requiredPermission: Permission;
  featureName?: string;
  upgradeLink?: string;
  fallback?: ReactNode;
}

/**
 * Inline component that checks permission AND plan
 * Shows upgrade message if user has permission but not the required plan
 * Shows children if user has both permission and plan
 * 
 * @example
 * <PlanCheck requiredPermission="manage_accounting" featureName="حسابداری">
 *   <AccountingContent />
 * </PlanCheck>
 */
export function PlanCheck({
  children,
  requiredPermission,
  featureName,
  upgradeLink,
  fallback,
}: PlanCheckProps) {
  const { plan, hasPlanAccess, loading } = usePlan();
  const [permissions, setPermissions] = useState<string[]>([]);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          const perms = Array.isArray(data.permissions)
            ? data.permissions
            : typeof data.permissions === "string"
            ? data.permissions.split(",").map((p: string) => p.trim())
            : [];
          setPermissions(perms);
        }
      } catch (error) {
        console.error("Error fetching permissions:", error);
      } finally {
        setChecking(false);
      }
    };

    fetchPermissions();
  }, []);

  if (loading || checking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Check permission
  const hasPermission = permissions.includes(requiredPermission);
  if (!hasPermission) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center">
        <p className="text-sm">شما دسترسی لازم برای این قابلیت را ندارید.</p>
      </div>
    );
  }

  // Check plan
  const requiredPlan = getRequiredPlanForPermission(requiredPermission);
  if (!hasPlanAccess(requiredPlan)) {
    return (
      <PlanUpgradeMessage
        requiredPlan={requiredPlan}
        featureName={featureName}
        upgradeLink={upgradeLink}
      />
    );
  }

  // User has both permission and plan
  return <>{children}</>;
}

