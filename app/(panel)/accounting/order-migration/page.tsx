"use client";
import { useState } from "react";

type MigrationResult = {
  contactsInserted: number;
  invoicesInserted: number;
  itemsInserted: number;
  migratedInvoices?: Array<{
    invoiceNumber: string;
    contactName: string;
    totalAmount: number;
    finalAmount: number;
    items: number;
  }>;
};

export default function OrderIntegration() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MigrationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runMigration = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/accounting/orders-integration", {
        method: "POST",
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Migration failed");
      }
      setResult(data.data as MigrationResult);
    } catch (err: any) {
      setError(err?.message || "خطا در اجرای مهاجرت");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 px-3 sm:px-0">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="w-3/4">
            <p className="text-sm font-semibold text-teal-600">
              انتقال سفارش‌ها
            </p>
            <h1 className="text-xl font-bold text-gray-900">
              افزودن سفارشات به فاکتور فروش
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              با استفاده از این قابلیت می توانید به راحتی سفارشات خود را به صورت
              اتوماتیک فاکتور فروش اضافه کنید . این امر با این قابلیت ها انجام
              می شود :
            </p>
          </div>
          <button
            onClick={runMigration}
            disabled={loading}
            className="px-4 py-2 w-max rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 text-white text-sm font-semibold shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "در حال اجرا..." : "ادغام سازی"}
          </button>
        </div>
        <div className="text-sm text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-xl p-4">
          <ul className="space-y-2 list-disc pr-4">
            <li>برای هر سفارش یک فاکتور فروش پرداخت شده تولید ثبت می شود</li>
            <li>ایجاد مخاطب برای فاکتور هایی که مشتری آن انتخاب شده است</li>
            <li>اقلام سفارش سفارشات به اقلام فاکتور فروش اضافه می شود</li>
            <li>ایمن در اجرای مجدد؛ از ایجاد رکورد تکراری جلوگیری می‌شود</li>
          </ul>
        </div>
      </div>

      {result && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900 mb-3">نتیجه مهاجرت</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
              <p className="text-xs font-semibold text-teal-700 uppercase">
                مخاطبین
              </p>
              <p className="text-2xl font-bold text-teal-800 mt-1">
                {result.contactsInserted}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs font-semibold text-blue-700 uppercase">
                فاکتورها
              </p>
              <p className="text-2xl font-bold text-blue-800 mt-1">
                {result.invoicesInserted}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs font-semibold text-amber-700 uppercase">
                آیتم‌ها
              </p>
              <p className="text-2xl font-bold text-amber-800 mt-1">
                {result.itemsInserted}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-sm">
          {error}
        </div>
      )}

    </div>
  );
}
