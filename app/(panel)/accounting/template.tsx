"use client";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface AccountingTemplateProps {
  children: ReactNode;
}

export default function AccountingTemplate({
  children,
}: AccountingTemplateProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/accounting") {
      return pathname === "/accounting";
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="xl:mt-0 mt-20">
      <div className="xl:px-0 px-7 py-5 space-y-6">
        {/* Header */}
        {/* <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-2xl xl:text-3xl font-bold text-gray-800">
              سیستم حسابداری
            </h1>
            <p className="text-gray-600 mt-1">
              مدیریت فاکتورها، مشتریان و تأمین‌کنندگان
            </p>
          </div>
        </div> */}

        {/* Navigation Tabs */}
        <div className="overflow-hidden">
          <div className="border rounded-full w-fit mx-auto border-gray-200 bg-white">
            <nav className="flex space-x-8 space-x-reverse p-1 justify-center">
              <Link
                href="/accounting"
                className={`py-3 px-5 font-medium text-sm transition-colors ${
                  isActive("/accounting")
                    ? "bg-teal-600 rounded-full text-white shadow-xl shadow-teal-700/20"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                خلاصه
              </Link>
              <Link
                href="/accounting/contacts"
                className={`py-3 px-5 font-medium text-sm transition-colors ${
                  isActive("/accounting/contacts")
                    ? "bg-teal-600 rounded-full text-white shadow-xl shadow-teal-700/20"
                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                مخاطبین
              </Link>
              <Link
                href="/accounting/invoices"
                className={`py-3 px-5 font-medium text-sm transition-colors ${
                  isActive("/accounting/invoices")
                    ? "bg-teal-600 rounded-full text-white shadow-xl shadow-teal-700/20"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                فاکتورها
              </Link>
              <Link
                href="/accounting/journals"
                className={`py-3 px-5 font-medium text-sm transition-colors ${
                  isActive("/accounting/journals")
                    ? "bg-teal-600 rounded-full text-white shadow-xl shadow-teal-700/20"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                سندها
              </Link>
              <Link
                href="/accounting/bank-accounts"
                className={`py-3 px-5 font-medium text-sm transition-colors ${
                  isActive("/accounting/bank-accounts")
                    ? "bg-teal-600 rounded-full text-white shadow-xl shadow-teal-700/20"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                حساب‌های بانکی
              </Link>
              <Link
                href="/accounting/order-migration"
                className={`py-3 px-5 font-medium text-sm transition-colors ${
                  isActive("/accounting/order-migration")
                    ? "bg-teal-600 rounded-full text-white shadow-xl shadow-teal-700/20"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                ادغام سفارشات
              </Link>
            </nav>
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
