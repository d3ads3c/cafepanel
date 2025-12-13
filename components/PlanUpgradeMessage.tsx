"use client";
import Link from "next/link";
import { type Plan } from "@/lib/plans";

interface PlanUpgradeMessageProps {
  requiredPlan: Plan;
  featureName?: string;
  upgradeLink?: string;
  className?: string;
}

/**
 * Reusable component to show plan upgrade message
 * Use this when user doesn't have the required plan
 */
export function PlanUpgradeMessage({
  requiredPlan,
  featureName,
  upgradeLink = "https://cafegah.ir/dashboard",
  className = "",
}: PlanUpgradeMessageProps) {
  const planNames: Record<Plan, string> = {
    basic: "پایه",
    pro: "حرفه‌ای",
    advance: "ویژه",
  };

  const planName = planNames[requiredPlan];

  return (
    <div
      className={`bg-gradient-to-br from-teal-600 to-teal-700 text-white p-6 rounded-3xl text-center shadow-lg ${className}`}
    >
      <div className="flex items-center justify-center mb-3">
        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
          <i className="fi fi-rr-lock text-2xl mt-2"></i>
        </div>
      </div>
      <h2 className="text-xl font-bold mb-2">ارتقای پلن</h2>
      <p className="text-sm font-light mb-1">
        {featureName
          ? `${featureName} تنها در پلن ${planName} و بالاتر قابل استفاده است.`
          : `این قابلیت تنها در پلن ${planName} و بالاتر قابل استفاده است.`}
      </p>
      <div className="mt-4">
        <Link
          href={upgradeLink}
          className="inline-block bg-white text-teal-600 rounded-xl py-3 px-6 font-semibold hover:bg-gray-100 transition-colors"
        >
          همین حالا ارتقا بده
        </Link>
      </div>
    </div>
  );
}

