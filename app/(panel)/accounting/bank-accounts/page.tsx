"use client";
import { useEffect, useState } from "react";

export default function BankAccountsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({
    id: "",
    name: "",
    holder_name: "",
    iban: "",
    card_number: "",
    account_no: "",
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchRows = async () => {
    const res = await fetch("/api/accounting/bank-accounts");
    const data = await res.json();
    if (res.ok && data.success) setRows(data.data);
  };

  useEffect(() => {
    fetchRows();
  }, []);

  const save = async () => {
    setLoading(true);
    const method = form.id ? "PUT" : "POST";
    const res = await fetch("/api/accounting/bank-accounts", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        id: form.id ? Number(form.id) : undefined,
      }),
    });
    setLoading(false);
    if (res.ok) {
      setForm({
        id: "",
        name: "",
        holder_name: "",
        iban: "",
        card_number: "",
        account_no: "",
      });
      setOpen(false);
      fetchRows();
    }
  };

  const edit = (row: any) => {
    setForm({
      id: row.id,
      name: row.name || "",
      holder_name: row.holder_name || "",
      iban: row.iban || "",
      card_number: row.card_number || "",
      account_no: row.account_no || "",
    });
    setOpen(true);
  };
  const remove = async (id: number) => {
    if (!confirm("حذف حساب بانکی؟")) return;
    const res = await fetch(`/api/accounting/bank-accounts?id=${id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchRows();
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-box p-4 flex justify-end">
        <button
          onClick={() => {
            setForm({
              id: "",
              name: "",
              holder_name: "",
              iban: "",
              card_number: "",
              account_no: "",
            });
            setOpen(true);
          }}
          className="rounded-xl bg-teal-600 text-white px-4 py-2 shadow-sm hover:bg-teal-700 active:scale-[.99] transition"
        >
          + حساب بانکی
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((r: any, idx: number) => {
            const digits = String(r.card_number || "")
              .replace(/\D/g, "")
              .slice(0, 16);
            const parts = [0, 1, 2, 3].map((i) =>
              digits.slice(i * 4, i * 4 + 4)
            );
            const masked = parts
              .map((p, i) =>
                i === 0 || i === 3 ? (p || "").padEnd(4, "•") : "••••"
              )
              .join(" ");
            const gradient =
              idx % 3 === 0
                ? "from-[#111827] via-[#1f2937] to-[#0f766e]"
                : idx % 3 === 1
                ? "from-[#4c1d95] via-[#7c3aed] to-[#0ea5e9]"
                : "from-[#0f172a] via-[#334155] to-[#2563eb]";
            return (
              <div key={r.id} className="space-y-3">
                <div
                  className={`relative overflow-hidden rounded-2xl p-5 text-white bg-gradient-to-br ${gradient} shadow-md`}
                >
                  <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-white/10" />
                  <div className="absolute -bottom-8 -right-8 w-32 h-32 rounded-full bg-black/10" />
                  <div className="flex items-center justify-between mb-8 relative">
                    <div className="text-sm opacity-80">{r.name}</div>
                    <div className="flex items-center gap-1">
                      <span className="w-8 h-8 rounded-full bg-white/30" />
                      <span className="w-8 h-8 rounded-full bg-white/60 -ml-2" />
                    </div>
                  </div>
                  <div className="mb-6">
                    <div className="text-lg tracking-widest font-mono select-all">
                      {masked}
                    </div>
                  </div>
                  <div className="flex items-end justify-between text-xs opacity-90">
                    <div>
                      <div className="opacity-70">HOLDER</div>
                      <div className="mt-0.5 text-sm">
                        {r.holder_name || "—"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="opacity-70">IBAN</div>
                      <div className="mt-0.5 text-xs max-w-[180px] truncate">
                        {r.iban || "—"}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => edit(r)}
                    className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    ویرایش
                  </button>
                  <button
                    onClick={() => remove(r.id)}
                    className="px-3 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50"
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {rows.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-6">
            حساب بانکی ثبت نشده است.
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="font-semibold">
                {form.id ? "ویرایش حساب بانکی" : "افزودن حساب بانکی"}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="size-8 rounded-xl hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <input
                placeholder="نام حساب"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="صاحب حساب"
                value={form.holder_name}
                onChange={(e) =>
                  setForm({ ...form, holder_name: e.target.value })
                }
                className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="شماره شبا"
                value={form.iban}
                onChange={(e) => setForm({ ...form, iban: e.target.value })}
                className="sm:col-span-2 rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"
              />
              <div className="sm:col-span-2">
                <div className="text-xs text-gray-600 mb-1">شماره کارت</div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 4 }).map((_, idx) => (
                    <input
                      key={idx}
                      maxLength={4}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-center"
                      value={(form.card_number || "").slice(
                        idx * 4,
                        idx * 4 + 4
                      )}
                      onChange={(e) => {
                        const parts = [0, 1, 2, 3].map((i) =>
                          (form.card_number || "").slice(i * 4, i * 4 + 4)
                        );
                        parts[idx] = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 4);
                        const val = parts.join("");
                        setForm((f) => ({ ...f, card_number: val }));
                      }}
                    />
                  ))}
                </div>
              </div>
              <input
                placeholder="شماره حساب"
                value={form.account_no}
                onChange={(e) =>
                  setForm({ ...form, account_no: e.target.value })
                }
                className="sm:col-span-2 rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
              >
                انصراف
              </button>
              <button
                onClick={save}
                disabled={loading}
                className="rounded-xl bg-teal-600 text-white px-4 py-2 shadow-sm hover:bg-teal-700 active:scale-[.99] transition"
              >
                ذخیره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
