"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";

interface AccountingStats {
  invoices: {
    total: number;
    sell: number;
    buy: number;
    totalSellAmount: number;
    totalBuyAmount: number;
  };
  contacts: {
    total: number;
  };
  bankAccounts: {
    total: number;
  };
}

export default function AccountingPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AccountingStats>({
    invoices: { total: 0, sell: 0, buy: 0, totalSellAmount: 0, totalBuyAmount: 0 },
    contacts: { total: 0 },
    bankAccounts: { total: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [invoicesRes, contactsRes, bankAccountsRes] = await Promise.all([
        fetch("/api/accounting/invoices"),
        fetch("/api/accounting/contacts"),
        fetch("/api/accounting/bank-accounts"),
      ]);

      const invoicesData = invoicesRes.ok ? await invoicesRes.json() : { data: [] };
      const contactsData = contactsRes.ok ? await contactsRes.json() : { data: [] };
      const bankAccountsData = bankAccountsRes.ok ? await bankAccountsRes.json() : { data: [] };

      const invoices = invoicesData.data || [];
      const contacts = contactsData.data || [];
      const bankAccounts = bankAccountsData.data || [];

      const toNumber = (value: any) => {
        const num = Number(value);
        return Number.isFinite(num) ? num : 0;
      };

      setStats({
        invoices: {
          total: invoices.length,
          sell: invoices.filter((i: any) => i.invoice_type === "sell").length,
          buy: invoices.filter((i: any) => i.invoice_type === "buy").length,
          totalSellAmount: invoices
            .filter((i: any) => i.invoice_type === "sell")
            .reduce((sum: number, i: any) => sum + toNumber(i.final_amount), 0),
          totalBuyAmount: invoices
            .filter((i: any) => i.invoice_type === "buy")
            .reduce((sum: number, i: any) => sum + toNumber(i.final_amount), 0),
        },
        contacts: {
          total: contacts.length,
        },
        bankAccounts: {
          total: bankAccounts.length,
        },
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const computed = useMemo(() => {
    const netFlow = stats.invoices.totalSellAmount - stats.invoices.totalBuyAmount;
    const avgSell =
      stats.invoices.sell > 0
        ? Math.round(stats.invoices.totalSellAmount / stats.invoices.sell)
        : 0;
    const avgBuy =
      stats.invoices.buy > 0
        ? Math.round(stats.invoices.totalBuyAmount / stats.invoices.buy)
        : 0;

    const formatAmount = (val: number) =>
      val.toLocaleString("fa-IR", { maximumFractionDigits: 0 });

    return { netFlow, avgSell, avgBuy, formatAmount };
  }, [stats]);

  return (
    <div className="space-y-6 px-3 sm:px-0">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold text-teal-600">گزارش مالی</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            خلاصه حسابداری
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            نمای کلی فاکتورها، گردش پول و حساب‌ها
          </p>
        </div>
        <div className="flex gap-2 sm:flex-row sm:justify-end">
          <Link
            href="/accounting/invoices/new"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold shadow-sm hover:shadow transition-all"
          >
            فاکتور جدید
          </Link>
          <Link
            href="/accounting/invoices"
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:border-teal-300 hover:bg-teal-50 transition-all"
          >
            همه فاکتورها
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="p-5 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white border-none shadow-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-300">
                جمع فروش
              </p>
              <h3 className="text-3xl font-black mt-2">
                {loading ? "..." : computed.formatAmount(stats.invoices.totalSellAmount)}{" "}
                <span className="text-sm font-semibold text-gray-300">تومان</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {stats.invoices.sell} فاکتور فروش
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/10 text-xs font-bold">
              فروش
            </span>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                جمع خرید
              </p>
              <h3 className="text-3xl font-black text-gray-900 mt-2">
                {loading ? "..." : computed.formatAmount(stats.invoices.totalBuyAmount)}{" "}
                <span className="text-sm font-semibold text-gray-500">تومان</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {stats.invoices.buy} فاکتور خرید
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold">
              خرید
            </span>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                جریان خالص
              </p>
              <h3
                className={`text-3xl font-black mt-2 ${
                  computed.netFlow >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {loading ? "..." : computed.formatAmount(computed.netFlow)}{" "}
                <span className="text-sm font-semibold text-gray-500">تومان</span>
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                فروش − خرید
              </p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                computed.netFlow >= 0
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-rose-50 text-rose-700"
              }`}
            >
              {computed.netFlow >= 0 ? "مثبت" : "منفی"}
            </span>
          </div>
        </Card>

        <Card className="p-5 bg-white border border-gray-200 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                موجودی داده
              </p>
              <h3 className="text-3xl font-black text-gray-900 mt-2">
                {loading ? "..." : stats.invoices.total}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {stats.contacts.total} مخاطب • {stats.bankAccounts.total} حساب بانکی
              </p>
            </div>
            <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
              داده‌ها
            </span>
          </div>
        </Card>
      </div>

      {/* Secondary metrics */}
      <Card className="p-5 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-100">
            <p className="text-xs font-semibold text-teal-700 uppercase tracking-wide">
              میانگین فروش
            </p>
            <h4 className="text-2xl font-bold text-teal-800 mt-1">
              {loading ? "..." : computed.formatAmount(computed.avgSell)}{" "}
              <span className="text-sm text-teal-600">تومان</span>
            </h4>
            <p className="text-xs text-teal-600 mt-1">
              به ازای هر فاکتور فروش
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
              میانگین خرید
            </p>
            <h4 className="text-2xl font-bold text-amber-800 mt-1">
              {loading ? "..." : computed.formatAmount(computed.avgBuy)}{" "}
              <span className="text-sm text-amber-600">تومان</span>
            </h4>
            <p className="text-xs text-amber-600 mt-1">
              به ازای هر فاکتور خرید
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
              تقسیم‌بندی فاکتورها
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="px-3 py-1 rounded-full bg-teal-100 text-teal-800 text-xs font-bold">
                فروش {stats.invoices.sell}
              </span>
              <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-bold">
                خرید {stats.invoices.buy}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              مجموع {stats.invoices.total} فاکتور ثبت شده
            </p>
          </div>
        </div>
      </Card>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/accounting/invoices">
          <Card className="p-5 border border-gray-200 hover:border-teal-400 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-teal-100 text-teal-700 rounded-xl flex items-center justify-center text-lg font-black">
                INV
              </div>
              <div>
                <h3 className="font-bold text-gray-900">مدیریت فاکتورها</h3>
                <p className="text-sm text-gray-500">
                  مشاهده، ویرایش و صدور فاکتور فروش و خرید
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/accounting/contacts">
          <Card className="p-5 border border-gray-200 hover:border-green-400 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-green-100 text-green-700 rounded-xl flex items-center justify-center text-lg font-black">
                CO
              </div>
              <div>
                <h3 className="font-bold text-gray-900">مخاطبین</h3>
                <p className="text-sm text-gray-500">
                  مشتریان و تأمین‌کنندگان را یکجا مدیریت کنید
                </p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href="/accounting/bank-accounts">
          <Card className="p-5 border border-gray-200 hover:border-purple-400 hover:shadow-md transition-all cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center text-lg font-black">
                BA
              </div>
              <div>
                <h3 className="font-bold text-gray-900">حساب‌های بانکی</h3>
                <p className="text-sm text-gray-500">
                  گردش حساب‌ها و کارت‌ها را سازماندهی کنید
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
