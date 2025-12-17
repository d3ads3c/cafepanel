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
      <div className="xl:px-0 py-5 space-y-6">
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
        <div className="px-3 sm:px-4">
          <div className="border rounded-full max-w-full xl:w-fit mx-auto border-gray-200 bg-white">
            <nav className="flex flex-nowrap overflow-x-auto hide-scroll scrollbar-none gap-1 sm:gap-2 p-1.5 sm:p-2 justify-start sm:justify-center text-sm">
              <Link
                href="/accounting"
                className={`whitespace-nowrap py-2 sm:py-2.5 px-3 sm:px-4 rounded-full font-medium transition-colors ${
                  isActive("/accounting")
                    ? "bg-teal-600 text-white shadow-md shadow-teal-700/20"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                خلاصه
              </Link>
              <Link
                href="/accounting/contacts"
                className={`whitespace-nowrap py-2 sm:py-2.5 px-3 sm:px-4 rounded-full font-medium transition-colors ${
                  isActive("/accounting/contacts")
                    ? "bg-teal-600 text-white shadow-md shadow-teal-700/20"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                مخاطبین
              </Link>
              <Link
                href="/accounting/invoices"
                className={`whitespace-nowrap py-2 sm:py-2.5 px-3 sm:px-4 rounded-full font-medium transition-colors ${
                  isActive("/accounting/invoices")
                    ? "bg-teal-600 text-white shadow-md shadow-teal-700/20"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                فاکتورها
              </Link>
              <Link
                href="/accounting/journals"
                className={`whitespace-nowrap py-2 sm:py-2.5 px-3 sm:px-4 rounded-full font-medium transition-colors ${
                  isActive("/accounting/journals")
                    ? "bg-teal-600 text-white shadow-md shadow-teal-700/20"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                سندها
              </Link>
              <Link
                href="/accounting/bank-accounts"
                className={`whitespace-nowrap py-2 sm:py-2.5 px-3 sm:px-4 rounded-full font-medium transition-colors ${
                  isActive("/accounting/bank-accounts")
                    ? "bg-teal-600 text-white shadow-md shadow-teal-700/20"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                حساب‌های بانکی
              </Link>
              <Link
                href="/accounting/order-migration"
                className={`whitespace-nowrap py-2 sm:py-2.5 px-3 sm:px-4 rounded-full font-medium transition-colors ${
                  isActive("/accounting/order-migration")
                    ? "bg-teal-600 text-white shadow-md shadow-teal-700/20"
                    : "text-gray-500 hover:text-gray-700"
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
