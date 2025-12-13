"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserPermissions } from "@/lib/userInfoParser";
import { normalizePlan, hasPlanAccess, type Plan } from "@/lib/plans";
import { getRequiredPlanForPermission, type Permission } from "@/lib/permissions";

export default function DesktopSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [displayName, setDisplayName] = useState<string>("کاربر");
  const [permissions, setPermissions] = useState<string[]>([]);
  const [userPlan, setUserPlan] = useState<string | null>(null);
  const [cafeName, setCafeName] = useState<string>("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.success) {
          const name = data.username || "کاربر";
          setCafeName(data.cafename || "");
          setDisplayName(name);
          // Parse permissions from the API response
          const perms = Array.isArray(data.permissions)
            ? data.permissions
            : typeof data.permissions === "string"
            ? data.permissions.split(",").map((p: string) => p.trim())
            : [];
          setPermissions(perms);
          // Get and normalize plan
          const plan = normalizePlan(data.plan);
          setUserPlan(plan);
        } else {
          // Fallback to POST method for backward compatibility
          const resPost = await fetch("/api/auth/me", { method: "POST" });
          const dataPost = await resPost.json();
          const userInfo = dataPost?.Info;
          const name = userInfo?.Fname || "کاربر";
          setCafeName(userInfo?.CafeName || "");
          setDisplayName(name);
          const perms = getUserPermissions(dataPost);
          setPermissions(perms);
          // Try to get plan from Info if available
          if (userInfo?.Plan) {
            const plan = normalizePlan(userInfo.Plan);
            setUserPlan(plan);
          }
        }
      } catch {}
    })();
  }, []);

  /**
   * Check if user has both permission AND required plan
   */
  const hasAccess = (permission: Permission | undefined): boolean => {
    if (!permission) return true; // No permission required
    
    // Check if user has the permission
    if (!permissions.includes(permission)) {
      return false;
    }
    
    // Check if user has the required plan for this permission
    if (!userPlan) return false;
    
    const requiredPlan = getRequiredPlanForPermission(permission);
    return hasPlanAccess(userPlan, requiredPlan);
  };

  const navigationItems = [
    {
      href: "/dashboard",
      icon: "fi fi-sr-house-blank",
      label: "خانه",
      active: pathname === "/dashboard",
      permission: "view_dashboard" as Permission,
    },
    {
      href: "/orders",
      icon: "fi fi-rr-rectangle-list",
      label: "سفارشات",
      active: pathname === "/orders",
      permission: "manage_orders" as Permission,
    },
    {
      href: "/customers",
      icon: "fi fi-rr-users",
      label: "مشتریان",
      active: pathname === "/customers",
      permission: "manage_customers" as Permission,
    },
    {
      href: "/menu",
      icon: "fi fi-rr-boxes",
      label: "منو",
      active: pathname === "/menu",
      permission: "manage_menu" as Permission,
    },
    {
      href: "/accounting",
      icon: "fi fi-rr-calculator",
      label: "حسابداری",
      active: pathname.startsWith("/accounting"),
      permission: "manage_accounting" as Permission,
    },
    // {
    //   href: "/shop",
    //   icon: "fi fi-rr-shop",
    //   label: "فروشگاه",
    //   active: pathname === "/shop"
    // },
    {
      href: "/prices",
      icon: "fi fi-rr-usd-circle",
      label: "قیمت رقبا",
      test: true,
      active: pathname.startsWith("/prices"),
      permission: "price_list" as Permission,
    },
    // {
    //   href: "/settings",
    //   icon: "fi fi-rr-settings",
    //   label: "تنظیمات",
    //   active: pathname.startsWith("/settings"),
    //   permission: "manage_settings" as Permission,
    // },
  ].filter((item) => hasAccess(item.permission));

  return (
    <div
      className={`hidden xl:flex flex-col bg-white border-l border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-800">{cafeName}</h1>
              <p className="text-sm text-gray-500">پنل مدیریت</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <i
              className={`fi fi-rr-angle-${
                isCollapsed ? "right" : "left"
              } text-gray-600`}
            ></i>
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                  item.active
                    ? "bg-teal-50 text-teal-600 border-r-2 border-teal-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <i
                  className={`${item.icon} text-xl ${
                    item.active
                      ? "text-teal-600"
                      : "text-gray-500 group-hover:text-gray-700"
                  }`}
                ></i>
                {!isCollapsed && (
                  <div className="font-medium flex items-center gap-3">
                    <span>{item.label}</span>
                    {item.test && (
                      <div className="rounded-full py-1 px-3 bg-teal-100 text-teal-500 text-xs">
                        آزمایشی
                      </div>
                    )}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div
          className={`flex items-center gap-3 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <i className="fi fi-rr-user text-teal-600 mt-1.5"></i>
          </div>
          {!isCollapsed && (
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{displayName}</p>
              <p className="text-xs text-gray-500">مدیر سیستم</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
