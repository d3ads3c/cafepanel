"use client";
import { usePathname } from "next/navigation";

export default function DesktopHeader() {
  const pathname = usePathname();

  const getPageTitle = () => {
    switch (pathname) {
      case "/dashboard":
        return "داشبورد";
      case "/orders":
        return "سفارشات";
      case "/customers":
        return "مشتریان";
      case "/menu":
        return "منو";
      case "/box":
        return "صندوق ها";
      case "/settings":
        return "تنظیمات";
      default:
        if (pathname.startsWith("/settings")) {
          return "تنظیمات";
        }
        return "پنل مدیریت";
    }
  };

  return (
    <header className="hidden xl:flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{getPageTitle()}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {new Date().toLocaleDateString('fa-IR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          })}
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <i className="fi fi-rr-bell text-xl"></i>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="جستجو..."
            className="w-64 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <i className="fi fi-rr-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">عصر بخیر</p>
            <p className="text-xs text-gray-500">سلام نیما</p>
          </div>
          <button className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center hover:bg-teal-200 transition-colors">
            <i className="fi fi-sr-user text-teal-600"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
