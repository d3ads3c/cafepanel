"use client";
import { useEffect, useState } from "react";

export default function LedgerPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [accountId, setAccountId] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [rows, setRows] = useState<any[]>([]);

  useEffect(() => { (async()=>{
    const res = await fetch('/api/accounting/accounts');
    const data = await res.json();
    if (res.ok && data.success) setAccounts(data.data);
  })(); }, []);

  const fetchLedger = async () => {
    if (!accountId) return;
    const params = new URLSearchParams();
    params.set('account_id', accountId);
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const res = await fetch(`/api/accounting/ledger?${params.toString()}`);
    const data = await res.json();
    if (res.ok && data.success) setRows(data.data);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-box p-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
        <select value={accountId} onChange={e=>setAccountId(e.target.value)} className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm">
          <option value="">انتخاب حساب</option>
          {accounts.map((a:any)=> <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
        </select>
        <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm" />
        <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm" />
        <button onClick={fetchLedger} className="rounded-xl bg-teal-600 text-white px-4 py-2 shadow-sm hover:bg-teal-700 active:scale-[.99] transition">نمایش</button>
      </div>
      <div className="bg-white rounded-2xl shadow-box p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-right text-xs text-gray-500">تاریخ</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">مرجع</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">شرح</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">بدهکار</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">بستانکار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r:any, idx:number)=> (
                <tr key={idx}>
                  <td className="px-3 py-2 text-sm">{new Date(r.entry_date).toLocaleDateString('fa-IR')}</td>
                  <td className="px-3 py-2 text-sm">{r.reference || '-'}</td>
                  <td className="px-3 py-2 text-sm">{r.description || '-'}</td>
                  <td className="px-3 py-2 text-sm">{new Intl.NumberFormat('fa-IR').format(r.debit||0)}</td>
                  <td className="px-3 py-2 text-sm">{new Intl.NumberFormat('fa-IR').format(r.credit||0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


