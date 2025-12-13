"use client";
import { useState, useEffect } from "react";
import type { Plan } from "./plans";
import { normalizePlan } from "./plans";

interface UserPlan {
  plan: string | null;
  loading: boolean;
}

/**
 * Client-side hook to check user plan
 * Fetches user info from /api/auth/me endpoint
 */
export function usePlan() {
  const [userPlan, setUserPlan] = useState<UserPlan>({
    plan: null,
    loading: true,
  });

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          const normalizedPlan = normalizePlan(data.plan);
          console.log(data.plan)
          setUserPlan({
            plan: normalizedPlan,
            loading: false,
          });
        } else {
          setUserPlan({ plan: null, loading: false });
        }
      } catch (error) {
        console.error("Error fetching user plan:", error);
        setUserPlan({ plan: null, loading: false });
      }
    };

    fetchUserPlan();
  }, []);

  /**
   * Check if user's plan meets the required plan level
   */
  const hasPlanAccess = (requiredPlan: Plan): boolean => {
    if (!userPlan.plan) return false;
    // Plan is already normalized when fetched, but normalize again to be safe
    const normalizedPlan = normalizePlan(userPlan.plan);
    const planHierarchy: Record<Plan, number> = {
      basic: 1,
      pro: 2,
      advance: 3,
    };
    return planHierarchy[normalizedPlan] >= planHierarchy[requiredPlan];
  };

  /**
   * Check if user has exact plan
   */
  const hasExactPlan = (plan: Plan): boolean => {
    if (!userPlan.plan) return false;
    const normalizedPlan = normalizePlan(userPlan.plan);
    return normalizedPlan === plan;
  };

  /**
   * Check if user has any of the specified plans
   */
  const hasAnyPlan = (plans: Plan[]): boolean => {
    if (!userPlan.plan) return false;
    const normalizedPlan = normalizePlan(userPlan.plan);
    return plans.includes(normalizedPlan);
  };

  return {
    plan: userPlan.plan,
    loading: userPlan.loading,
    hasPlanAccess,
    hasExactPlan,
    hasAnyPlan,
  };
}

