"use client";
import { useEffect, useState } from "react";

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [form, setForm] = useState({ code: "", name: "", type: "asset", parent_id: "" });
  const [loading, setLoading] = useState(false);

  const fetchAccounts = async () => {
    const res = await fetch('/api/accounting/accounts');
    const data = await res.json();
    if (res.ok && data.success) setAccounts(data.data);
  };

  useEffect(() => { fetchAccounts(); }, []);

  const createAccount = async () => {
    setLoading(true);
    const res = await fetch('/api/accounting/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, parent_id: form.parent_id || null }) });
    setLoading(false);
    if (res.ok) { setForm({ code: "", name: "", type: "asset", parent_id: "" }); fetchAccounts(); }
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-box p-4">
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
          <input placeholder="کد" value={form.code} onChange={e=>setForm({ ...form, code: e.target.value })} className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm" />
          <input placeholder="نام" value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm" />
          <select value={form.type} onChange={e=>setForm({ ...form, type: e.target.value })} className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm">
            <option value="asset">دارایی</option>
            <option value="liability">بدهی</option>
            <option value="equity">حقوق صاحبان سهام</option>
            <option value="revenue">درآمد</option>
            <option value="expense">هزینه</option>
          </select>
          <select value={form.parent_id} onChange={e=>setForm({ ...form, parent_id: e.target.value })} className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm">
            <option value="">بدون والد</option>
            {accounts.map((a:any)=> (
              <option key={a.id} value={a.id}>{a.code} - {a.name}</option>
            ))}
          </select>
          <button onClick={createAccount} disabled={loading} className="rounded-xl bg-teal-600 text-white px-4 py-2 shadow-sm hover:bg-teal-700 active:scale-[.99] transition">ثبت</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-box p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-right text-xs text-gray-500">کد</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">نام</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">نوع</th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">فعال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {accounts.map((a:any)=> (
                <tr key={a.id}>
                  <td className="px-3 py-2 text-sm">{a.code}</td>
                  <td className="px-3 py-2 text-sm">{a.name}</td>
                  <td className="px-3 py-2 text-sm">{a.type}</td>
                  <td className="px-3 py-2 text-sm">{a.is_active ? '✓' : '✕'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


