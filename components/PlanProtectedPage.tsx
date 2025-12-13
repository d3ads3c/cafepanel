"use client";
import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PlanUpgradeMessage } from "./PlanUpgradeMessage";
import { getRequiredPlanForPermission, type Permission } from "@/lib/permissions";
import { normalizePlan, hasPlanAccess, type Plan } from "@/lib/plans";

interface PlanProtectedPageProps {
  children: ReactNode;
  requiredPermission: Permission;
  featureName?: string;
  upgradeLink?: string;
  showLoading?: boolean;
}

/**
 * Client-side page wrapper that checks both permission and plan
 * Shows upgrade message if user doesn't have required plan
 * Redirects or shows error if user doesn't have permission
 */
export function PlanProtectedPage({
  children,
  requiredPermission,
  featureName,
  upgradeLink,
  showLoading = true,
}: PlanProtectedPageProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();

        if (data.success) {
          // Get permissions
          const perms = Array.isArray(data.permissions)
            ? data.permissions
            : typeof data.permissions === "string"
            ? data.permissions.split(",").map((p: string) => p.trim())
            : [];
          setPermissions(perms);

          // Get and normalize plan
          const plan = normalizePlan(data.plan);
          setUserPlan(plan);

          // Check permission
          const hasPermission = perms.includes(requiredPermission);
          if (!hasPermission) {
            setHasAccess(false);
            setLoading(false);
            return;
          }

          // Check plan
          const requiredPlan = getRequiredPlanForPermission(requiredPermission);
          const hasRequiredPlan = hasPlanAccess(plan, requiredPlan);
          setHasAccess(hasRequiredPlan);
        } else {
          // Fallback to POST method
          const resPost = await fetch("/api/auth/me", { method: "POST" });
          const dataPost = await resPost.json();
          const userInfo = dataPost?.Info;

          if (userInfo) {
            const perms = userInfo.Permissions
              ? typeof userInfo.Permissions === "string"
                ? userInfo.Permissions.split(",").map((p: string) => p.trim())
                : Array.isArray(userInfo.Permissions)
                ? userInfo.Permissions
                : []
              : [];
            setPermissions(perms);

            const plan = normalizePlan(userInfo.Plan);
            setUserPlan(plan);

            const hasPermission = perms.includes(requiredPermission);
            if (!hasPermission) {
              setHasAccess(false);
              setLoading(false);
              return;
            }

            const requiredPlan = getRequiredPlanForPermission(requiredPermission);
            const hasRequiredPlan = hasPlanAccess(plan, requiredPlan);
            setHasAccess(hasRequiredPlan);
          } else {
            setHasAccess(false);
          }
        }
      } catch (error) {
        console.error("Error checking access:", error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [requiredPermission]);

  if (loading && showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (hasAccess === false) {
    // Check if it's a permission issue or plan issue
    const hasPermission = permissions.includes(requiredPermission);
    const requiredPlan = getRequiredPlanForPermission(requiredPermission);

    if (!hasPermission) {
      // No permission - show error or redirect
      return (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-2xl text-center max-w-md">
            <div className="flex items-center justify-center mb-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <i className="fi fi-rr-ban text-2xl text-red-600"></i>
              </div>
            </div>
            <h2 className="text-xl font-bold mb-2">دسترسی محدود</h2>
            <p className="text-sm">
              شما دسترسی لازم برای مشاهده این صفحه را ندارید.
            </p>
          </div>
        </div>
      );
    }

    // Has permission but not the required plan - show upgrade message
    return (
      <div className="flex items-center justify-center min-h-[400px] p-4">
        <div className="w-full max-w-md">
          <PlanUpgradeMessage
            requiredPlan={requiredPlan}
            featureName={featureName}
            upgradeLink={upgradeLink}
          />
        </div>
      </div>
    );
  }

  // User has both permission and plan - show content
  return <>{children}</>;
}

