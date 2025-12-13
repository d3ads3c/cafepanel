"use client";
import { usePathname, useRouter } from "next/navigation";

export default function DesktopHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) {
        console.error('Logout failed:', response.statusText);
      }
    } catch (error) {
      console.error('Logout error');
    } finally {
      // Always redirect to login page, even if logout API fails
      router.replace('/');
    }
  }

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
        {/* <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <i className="fi fi-rr-bell text-xl"></i>
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
        </button> */}

        {/* Search */}
        {/* <div className="relative">
          <input
            type="text"
            placeholder="جستجو..."
            className="w-64 px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <i className="fi fi-rr-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
        </div> */}

        {/* User Menu */}
        <div className="flex items-center gap-3">
          {/* <button type="button" className="border border-teal-600 text-teal-600 rounded-xl py-2 text-sm px-3 flex items-center gap-2">
            <div className="rounded-full bg-teal-600 text-white size-6 flex items-center justify-center">
              0
            </div>
            <p>سبد خرید شما</p>
          </button> */}
          <button onClick={handleLogout} className="inline-flex items-center gap-2 px-3 py-1 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors">
            <i className="fi fi-sr-power mt-1.5 text-red-500"></i>
            <span className="text-sm">خروج</span>
          </button>
        </div>
      </div>
    </header>
  );
}
