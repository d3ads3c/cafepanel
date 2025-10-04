"use client";
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface AccountingTemplateProps {
  children: ReactNode;
}

export default function AccountingTemplate({ children }: AccountingTemplateProps) {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/accounting') {
      return pathname === '/accounting';
    }
    return pathname.startsWith(path);
  };

  return (
    <div className="xl:mt-0 mt-20">
      <div className="xl:px-0 px-7 py-5 space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-2xl xl:text-3xl font-bold text-gray-800">سیستم حسابداری</h1>
            <p className="text-gray-600 mt-1">مدیریت فاکتورها، مشتریان و تأمین‌کنندگان</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-box overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 space-x-reverse px-6">
              <a
                href="/accounting"
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive('/accounting')
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                فاکتورها
              </a>
              <a
                href="/accounting/contacts"
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive('/accounting/contacts')
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                مخاطبین
              </a>
              <a
                href="/accounting/reports"
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive('/accounting/reports')
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                گزارشات
              </a>
            </nav>
          </div>
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
