"use client";

import { useEffect, useState } from "react";
import { Plan, normalizePlan } from "@/lib/plans";
import Link from "next/link";

type SubscriptionState = {
  cafeName: string;
  plan: Plan | null;
  expiresAt?: string | null;
  loading: boolean;
  error?: string;
};

const PLAN_LABELS: Record<Plan, string> = {
  basic: "پایه",
  pro: "حرفه‌ای",
  advance: "ویژه",
};

const PLAN_BADGE_COLORS: Record<Plan, string> = {
  basic: "bg-amber-100 text-amber-700",
  pro: "bg-sky-100 text-sky-700",
  advance: "bg-teal-100 text-teal-700",
};

function formatDate(dateString?: string | null) {
  if (!dateString) return "نامشخص";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "نامشخص";
  return date.toLocaleDateString("fa-IR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function parseSubscriptionInfo(data: any) {
  const planValue: string | null =
    data?.plan ||
    data?.Plan ||
    data?.Info?.Plan ||
    data?.Info?.plan ||
    null;
  const plan = planValue ? normalizePlan(planValue) : null;

  const cafeName =
    data?.cafename || data?.CafeName || data?.Info?.CafeName || "";

  const expiresAt =
    data?.expiresAt ||
    data?.expireAt ||
    data?.ExpireAt ||
    data?.PlanExpire ||
    data?.planExpire ||
    data?.Info?.ExpireAt ||
    data?.Info?.ExpireDate ||
    null;

  return { plan, cafeName, expiresAt };
}

export function SubscriptionInfo() {
  const [state, setState] = useState<SubscriptionState>({
    cafeName: "",
    plan: null,
    expiresAt: null,
    loading: true,
  });

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const parsed = parseSubscriptionInfo(data);
          setState({
            cafeName: parsed.cafeName,
            plan: parsed.plan,
            expiresAt: parsed.expiresAt,
            loading: false,
          });
          return;
        }
      } catch (error) {
        // Fallback handled below
      }

      // Fallback to legacy POST endpoint
      try {
        const resPost = await fetch("/api/auth/me", { method: "POST" });
        const dataPost = await resPost.json();
        const parsed = parseSubscriptionInfo(dataPost);
        setState({
          cafeName: parsed.cafeName,
          plan: parsed.plan,
          expiresAt: parsed.expiresAt,
          loading: false,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "عدم دریافت اطلاعات اشتراک",
        }));
      }
    };

    fetchInfo();
  }, []);

  const planLabel = state.plan ? PLAN_LABELS[state.plan] : "نامشخص";
  const badgeClass = state.plan
    ? PLAN_BADGE_COLORS[state.plan]
    : "bg-gray-100 text-gray-500";

  return (
    <div className="space-y-3 text-center">
      <div className="rounded-2xl size-20 bg-gray-100 text-4xl flex items-center justify-center mx-auto">
        <i className="fi fi-br-store-alt mt-1.5 text-teal-600"></i>
      </div>
      <div>
        <h2 className="text-2xl text-white font-bold">
          {state.cafeName || "کافه شما"}
        </h2>
      </div>
      <div className="flex items-center gap-4 justify-center text-white">
        <p>اشتراک</p>
        <p>|</p>
        <div className={`rounded-full w-fit py-1 px-4 ${badgeClass}`}>
          {state.loading ? "در حال بارگذاری..." : planLabel}
        </div>
      </div>
      {state.error && (
        <div className="text-xs text-red-100">{state.error}</div>
      )}
      <div className="!mt-5">
        <Link
          href={"/change-plan"}
          className="text-white bg-gray-700/30 backdrop-blur-2xl rounded-full py-1 px-4 w-fit flex items-center gap-2 justify-between mx-auto"
        >
          <i className="fi fi-br-link-alt mt-1.5"></i>
          مدیریت اشتراک
        </Link>
      </div>
    </div>
  );
}

