"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DesktopSidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [displayName, setDisplayName] = useState<string>('کاربر');
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        const name = data?.data?.username || 'کاربر';
        const perms: string[] = data?.data?.permissions || [];
        setDisplayName(name);
        setPermissions(perms);
      } catch {}
    })();
  }, []);

  const navigationItems = [
    {
      href: "/dashboard",
      icon: "fi fi-sr-house-blank",
      label: "خانه",
      active: pathname === "/dashboard",
      permission: "view_dashboard"
    },
    {
      href: "/orders",
      icon: "fi fi-rr-rectangle-list",
      label: "سفارشات",
      active: pathname === "/orders",
      permission: "manage_orders"
    },
    {
      href: "/customers",
      icon: "fi fi-rr-users",
      label: "مشتریان",
      active: pathname === "/customers",
      permission: "manage_customers"
    },
    {
      href: "/menu",
      icon: "fi fi-rr-boxes",
      label: "منو",
      active: pathname === "/menu",
      permission: "manage_menu"
    },
    // {
    //   href: "/accounting",
    //   icon: "fi fi-rr-calculator",
    //   label: "حسابداری",
    //   active: pathname.startsWith("/accounting"),
    //   permission: "manage_accounting"
    // },
    // {
    //   href: "/shop",
    //   icon: "fi fi-rr-shop",
    //   label: "فروشگاه",
    //   active: pathname === "/shop"
    // },
    {
      href: "/settings",
      icon: "fi fi-rr-settings",
      label: "تنظیمات",
      active: pathname.startsWith("/settings"),
      permission: "manage_users"
    }
  ].filter(item => !item.permission || permissions.includes(item.permission));

  return (
    <div className={`hidden xl:flex flex-col bg-white border-l border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h1 className="text-xl font-bold text-gray-800">کافه پنل</h1>
              <p className="text-sm text-gray-500">پنل مدیریت</p>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <i className={`fi fi-rr-angle-${isCollapsed ? 'right' : 'left'} text-gray-600`}></i>
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
                    ? 'bg-teal-50 text-teal-600 border-r-2 border-teal-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <i className={`${item.icon} text-xl ${item.active ? 'text-teal-600' : 'text-gray-500 group-hover:text-gray-700'}`}></i>
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
            <i className="fi fi-sr-user text-teal-600"></i>
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
