"use client";
import { useEffect, useState } from "react";

export default function JournalsPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [form, setForm] = useState({
    entry_date: "",
    reference: "",
    description: "",
    lines: [
      { account_id: "", debit: 0, credit: 0, line_description: "" },
    ] as any[],
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<any>(null);

  const fetchAll = async () => {
    const [jeRes, acRes] = await Promise.all([
      fetch("/api/accounting/journals"),
      fetch("/api/accounting/accounts"),
    ]);
    const je = await jeRes.json();
    const ac = await acRes.json();
    if (jeRes.ok && je.success) setEntries(je.data);
    if (acRes.ok && ac.success) setAccounts(ac.data);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addLine = () =>
    setForm((f) => ({
      ...f,
      lines: [
        ...f.lines,
        { account_id: "", debit: 0, credit: 0, line_description: "" },
      ],
    }));
  const removeLine = (i: number) =>
    setForm((f) => ({
      ...f,
      lines: f.lines.filter((_: any, idx: number) => idx !== i),
    }));

  const submit = async () => {
    setLoading(true);
    const res = await fetch("/api/accounting/journals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        lines: form.lines.map((l) => ({
          ...l,
          account_id: Number(l.account_id || 0),
          debit: Number(l.debit || 0),
          credit: Number(l.credit || 0),
        })),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setForm({
        entry_date: "",
        reference: "",
        description: "",
        lines: [{ account_id: "", debit: 0, credit: 0, line_description: "" }],
      });
      setOpen(false);
      fetchAll();
    }
  };

  const openModal = () => {
    setForm({
      entry_date: new Date().toISOString().split("T")[0],
      reference: "",
      description: "",
      lines: [{ account_id: "", debit: 0, credit: 0, line_description: "" }],
    });
    setOpen(true);
  };

  const viewDetails = (entry: any) => {
    setSelectedEntry(entry);
  };

  return (
    <div className="mt-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-box p-4 flex justify-end">
        <button
          onClick={openModal}
          className="rounded-xl bg-teal-600 text-white px-4 py-2 shadow-sm hover:bg-teal-700 active:scale-[.99] transition"
        >
          + ثبت سند جدید
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-box p-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-right text-xs text-gray-500">
                  تاریخ
                </th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">
                  شماره سند
                </th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">
                  مرجع
                </th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">
                  شرح
                </th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">
                  بدهکار
                </th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">
                  بستانکار
                </th>
                <th className="px-3 py-2 text-right text-xs text-gray-500">
                  عملیات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e: any) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm">
                    {new Date(e.entry_date).toLocaleDateString("fa-IR")}
                  </td>
                  <td className="px-3 py-2 text-sm font-mono">#{e.id}</td>
                  <td className="px-3 py-2 text-sm">{e.reference || "-"}</td>
                  <td className="px-3 py-2 text-sm">{e.description || "-"}</td>
                  <td className="px-3 py-2 text-sm text-red-600">
                    {new Intl.NumberFormat("fa-IR").format(e.total_debit || 0)}
                  </td>
                  <td className="px-3 py-2 text-sm text-green-600">
                    {new Intl.NumberFormat("fa-IR").format(e.total_credit || 0)}
                  </td>
                  <td className="px-3 py-2 text-sm">
                    <button
                      onClick={() => viewDetails(e)}
                      className="text-teal-600 hover:text-teal-700 text-xs"
                    >
                      جزئیات
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {entries.length === 0 && (
          <div className="text-center text-sm text-gray-500 py-6">
            سند حسابداری ثبت نشده است.
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">ثبت سند حسابداری</div>
              <button
                onClick={() => setOpen(false)}
                className="size-8 rounded-xl hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <input
                type="date"
                value={form.entry_date}
                onChange={(e) =>
                  setForm({ ...form, entry_date: e.target.value })
                }
                className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="شماره مرجع"
                value={form.reference}
                onChange={(e) =>
                  setForm({ ...form, reference: e.target.value })
                }
                className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"
              />
              <input
                placeholder="توضیحات کلی"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-3 mb-4">
              <div className="text-sm font-medium text-gray-700">
                ردیف‌های سند:
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-right text-xs text-gray-500">
                        حساب
                      </th>
                      <th className="px-3 py-2 text-right text-xs text-gray-500">
                        بدهکار
                      </th>
                      <th className="px-3 py-2 text-right text-xs text-gray-500">
                        بستانکار
                      </th>
                      <th className="px-3 py-2 text-right text-xs text-gray-500">
                        شرح ردیف
                      </th>
                      <th className="px-3 py-2 text-right text-xs text-gray-500">
                        عملیات
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {form.lines.map((l: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <select
                            value={l.account_id}
                            onChange={(e) => {
                              const v = e.target.value;
                              setForm((f) => {
                                const arr = [...f.lines];
                                arr[idx] = { ...arr[idx], account_id: v };
                                return { ...f, lines: arr };
                              });
                            }}
                            className="w-full rounded-xl border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"
                          >
                            <option value="">انتخاب حساب</option>
                            {accounts.map((a: any) => (
                              <option key={a.id} value={a.id}>
                                {a.code} - {a.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            placeholder="0"
                            value={l.debit}
                            onChange={(e) => {
                              const v = e.target.value;
                              setForm((f) => {
                                const arr = [...f.lines];
                                arr[idx] = { ...arr[idx], debit: v };
                                return { ...f, lines: arr };
                              });
                            }}
                            className="w-full rounded-xl border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            placeholder="0"
                            value={l.credit}
                            onChange={(e) => {
                              const v = e.target.value;
                              setForm((f) => {
                                const arr = [...f.lines];
                                arr[idx] = { ...arr[idx], credit: v };
                                return { ...f, lines: arr };
                              });
                            }}
                            className="w-full rounded-xl border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            placeholder="شرح ردیف"
                            value={l.line_description || ""}
                            onChange={(e) => {
                              const v = e.target.value;
                              setForm((f) => {
                                const arr = [...f.lines];
                                arr[idx] = { ...arr[idx], line_description: v };
                                return { ...f, lines: arr };
                              });
                            }}
                            className="w-full rounded-xl border-gray-300 bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => removeLine(idx)}
                            className="rounded-xl border border-red-200 text-red-600 hover:bg-red-50 px-3 py-2 text-sm"
                          >
                            حذف
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={addLine}
                className="rounded-xl border border-teal-200 text-teal-600 hover:bg-teal-50 px-4 py-2 text-sm"
              >
                + افزودن ردیف
              </button>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-50"
              >
                انصراف
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="rounded-xl bg-teal-600 text-white px-4 py-2 shadow-sm hover:bg-teal-700 active:scale-[.99] transition"
              >
                {loading ? "در حال ثبت..." : "ثبت سند"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">
                جزئیات سند #{selectedEntry.id}
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="size-8 rounded-xl hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div>
                <div className="text-xs text-gray-500 mb-1">تاریخ</div>
                <div className="text-sm">
                  {new Date(selectedEntry.entry_date).toLocaleDateString(
                    "fa-IR"
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">شماره مرجع</div>
                <div className="text-sm">{selectedEntry.reference || "—"}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">توضیحات</div>
                <div className="text-sm">
                  {selectedEntry.description || "—"}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">
                      حساب
                    </th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">
                      شرح ردیف
                    </th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">
                      بدهکار
                    </th>
                    <th className="px-3 py-2 text-right text-xs text-gray-500">
                      بستانکار
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedEntry.lines?.map((line: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-3 py-2 text-sm">
                        {line.account_code} - {line.account_name}
                      </td>
                      <td className="px-3 py-2 text-sm">
                        {line.line_description || "—"}
                      </td>
                      <td className="px-3 py-2 text-sm text-red-600">
                        {line.debit > 0
                          ? new Intl.NumberFormat("fa-IR").format(line.debit)
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-sm text-green-600">
                        {line.credit > 0
                          ? new Intl.NumberFormat("fa-IR").format(line.credit)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-medium">
                    <td colSpan={2} className="px-3 py-2 text-sm">
                      مجموع:
                    </td>
                    <td className="px-3 py-2 text-sm text-red-600">
                      {new Intl.NumberFormat("fa-IR").format(
                        selectedEntry.total_debit || 0
                      )}
                    </td>
                    <td className="px-3 py-2 text-sm text-green-600">
                      {new Intl.NumberFormat("fa-IR").format(
                        selectedEntry.total_credit || 0
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
