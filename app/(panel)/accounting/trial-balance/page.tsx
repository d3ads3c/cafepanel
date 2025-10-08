"use client";
import { useEffect, useState } from "react";

export default function TrialBalancePage() {
  const [to, setTo] = useState<string>("");
  const [rows, setRows] = useState<any[]>([]);

  const fetchTB = async () => {
    const params = new URLSearchParams();
    if (to) params.set('to', to);
    const res = await fetch(`/api/accounting/trial-balance?${params.toString()}`);
    const data = await res.json();
    if (res.ok && data.success) setRows(data.data);
  };

  useEffect(() => { fetchTB(); }, []);

  const sum = (k:string) => rows.reduce((s:number,r:any)=> s + Number(r[k]||0), 0);

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-box p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm" />
        <button onClick={fetchTB} className="rounded-xl bg-teal-600 text-white px-4 py-2 shadow-sm hover:bg-teal-700 active:scale-[.99] transition">به‌روزرسانی</button>
      </div>
      <div className="bg-white rounded-2xl shadow-box p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-right text-xs text-gray-500">کد</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">نام حساب</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">بدهکار</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">بستانکار</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">مانده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r:any)=> (
                <tr key={r.id}>
                  <td className="px-3 py-2 text-sm">{r.code}</td>
                  <td className="px-3 py-2 text-sm">{r.name}</td>
                  <td className="px-3 py-2 text-sm">{new Intl.NumberFormat('fa-IR').format(r.debit||0)}</td>
                  <td className="px-3 py-2 text-sm">{new Intl.NumberFormat('fa-IR').format(r.credit||0)}</td>
                  <td className="px-3 py-2 text-sm">{new Intl.NumberFormat('fa-IR').format(r.balance||0)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="px-3 py-2 text-sm" colSpan={2}>جمع</td>
                <td className="px-3 py-2 text-sm">{new Intl.NumberFormat('fa-IR').format(sum('debit'))}</td>
                <td className="px-3 py-2 text-sm">{new Intl.NumberFormat('fa-IR').format(sum('credit'))}</td>
                <td className="px-3 py-2 text-sm">{new Intl.NumberFormat('fa-IR').format(sum('balance'))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}


