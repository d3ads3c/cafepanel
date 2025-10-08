"use client";
import { useEffect, useState } from "react";

export default function FinancialsPage() {
  const [to, setTo] = useState<string>("");
  const [balances, setBalances] = useState<any[]>([]);
  const [income, setIncome] = useState<any | null>(null);

  const fetchData = async () => {
    const params = new URLSearchParams();
    if (to) params.set('to', to);
    const res = await fetch(`/api/accounting/financials?${params.toString()}`);
    const data = await res.json();
    if (res.ok && data.success) {
      setBalances(data.data.balances || []);
      setIncome(data.data.income || null);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const totalByType = (type: string) => {
    const row = (balances as any[]).find((r:any)=> r.type === type);
    return Number(row?.balance || 0);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-box p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm" />
        <button onClick={fetchData} className="rounded-xl bg-teal-600 text-white px-4 py-2 shadow-sm hover:bg-teal-700 active:scale-[.99] transition">به‌روزرسانی</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-box p-4">
          <div className="font-semibold mb-3">ترازنامه (خلاصه)</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500 mb-1">دارایی‌ها</div>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('fa-IR').format(totalByType('asset'))}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500 mb-1">بدهی‌ها</div>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('fa-IR').format(totalByType('liability'))}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500 mb-1">حقوق صاحبان سهام</div>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('fa-IR').format(totalByType('equity'))}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-box p-4">
          <div className="font-semibold mb-3">صورت سود و زیان (خلاصه)</div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500 mb-1">درآمد</div>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('fa-IR').format(Number(income?.revenue||0))}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500 mb-1">هزینه</div>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('fa-IR').format(Number(income?.expense||0))}</div>
            </div>
            <div className="rounded-xl border p-4 col-span-2">
              <div className="text-xs text-gray-500 mb-1">سود خالص</div>
              <div className="text-2xl font-bold">{new Intl.NumberFormat('fa-IR').format(Number(income?.revenue||0) - Number(income?.expense||0))}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


