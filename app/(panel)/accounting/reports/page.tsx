"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import JalaliRangePicker from "@/components/ui/JalaliRangePicker";
import { Card, CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

const ApexChart = dynamic(() => import("react-apexcharts"), { ssr: false });

type InvoiceTypeFilter = "all" | "buy" | "sell";

type Totals = {
  invoice_count: number;
  total_amount: number;
  final_amount: number;
  paid_count: number;
  pending_count: number;
  partial_count: number;
  cancelled_count: number;
};

export default function AccountingReportsPage() {
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [type, setType] = useState<InvoiceTypeFilter>("all");
  const [loading, setLoading] = useState<boolean>(false);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [series, setSeries] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [topContacts, setTopContacts] = useState<any[]>([]);
  const [aging, setAging] = useState<any | null>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [pnl, setPnl] = useState<any | null>(null);
  const [arap, setArap] = useState<any | null>(null);
  const [cashflow, setCashflow] = useState<any[]>([]);
  const [tab, setTab] = useState<"overview" | "pnl" | "arap" | "monthly" | "cashflow">("overview");

  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (type && type !== "all") params.set("type", type);
    return params.toString();
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const q = buildQuery();
      const res = await fetch(`/api/accounting/reports${q ? `?${q}` : ""}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTotals(data.data.totals);
        setSeries(data.data.series);
        setPaymentMethods(data.data.payment_methods);
        setTopContacts(data.data.top_contacts);
        setAging(data.data.aging);
        setMonthly(data.data.monthly || []);
        setPnl(data.data.pnl || null);
        setArap(data.data.arap || null);
        setCashflow(data.data.cashflow_by_method || []);
      }
    } catch (e) {
      console.error("Failed to fetch reports", e);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fa-IR").format(amount || 0) + " تومان";

  const csvRows = useMemo(() => {
    const rows: string[] = [];
    rows.push("type,label,value");
    if (totals) {
      rows.push(`totals,invoice_count,${totals.invoice_count}`);
      rows.push(`totals,total_amount,${totals.total_amount}`);
      rows.push(`totals,final_amount,${totals.final_amount}`);
      rows.push(`totals,paid_count,${totals.paid_count}`);
      rows.push(`totals,pending_count,${totals.pending_count}`);
      rows.push(`totals,partial_count,${totals.partial_count}`);
      rows.push(`totals,cancelled_count,${totals.cancelled_count}`);
    }
    for (const r of series) rows.push(`series,${r.day},${r.amount}`);
    for (const p of paymentMethods)
      rows.push(`payment_method,${p.payment_method},${p.amount}`);
    for (const c of topContacts) rows.push(`top_contact,${c.name},${c.amount}`);
    if (aging)
      rows.push(
        `aging,0-30,${aging.bucket_0_30}` +
          "\n" +
          `aging,31-60,${aging.bucket_31_60}` +
          "\n" +
          `aging,61-90,${aging.bucket_61_90}` +
          "\n" +
          `aging,90+,${aging.bucket_90_plus}`,
      );
    return rows.join("\n");
  }, [totals, series, paymentMethods, topContacts, aging]);

  const downloadCsv = () => {
    const blob = new Blob(["\uFEFF" + csvRows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "accounting-report.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadExcel = () => {
    // Create simple HTML table workbook for Excel compatibility without packages
    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
      <body>
        <table border="1">
          <thead><tr><th>type</th><th>label</th><th>value</th></tr></thead>
          <tbody>
            ${csvRows.split('\n').slice(1).map(r => {
              const [type,label,value] = r.split(',');
              return `<tr><td>${type||''}</td><td>${label||''}</td><td>${value||''}</td></tr>`
            }).join('')}
          </tbody>
        </table>
      </body></html>`;
    const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accounting-report.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printView = () => {
    const printContent = document.getElementById('reports-print-root');
    if (!printContent) return window.print();
    const w = window.open('', 'PRINT', 'height=800,width=1024');
    if (!w) return;
    w.document.write('<html><head><title>Reports</title>');
    w.document.write('<style>body{font-family:sans-serif;direction:rtl} .card{border:1px solid #e5e7eb;border-radius:12px;padding:12px;margin:8px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #eee;padding:6px;text-align:right;font-size:12px}</style>');
    w.document.write('</head><body>');
    w.document.write(printContent.innerHTML);
    w.document.write('</body></html>');
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  const chartOptions = useMemo(() => ({
    chart: { id: "series", toolbar: { show: false } },
    stroke: { curve: "smooth", width: 3 },
    colors: ["#0d9488", "#ef4444"],
    xaxis: { categories: series.map((s: any) => s.day) },
    yaxis: { labels: { formatter: (v: number) => new Intl.NumberFormat("fa-IR").format(Math.round(v)) } },
    dataLabels: { enabled: false },
    grid: { borderColor: "#eee" },
    tooltip: { y: { formatter: (v: number) => new Intl.NumberFormat("fa-IR").format(Math.round(v)) + " تومان" } },
    legend: { position: "top" as const },
  }), [series]);

  const chartSeries = useMemo(() => ([
    { name: "مجموع", data: series.map((s: any) => Number(s.amount) || 0) },
    { name: "فروش", data: series.map((s: any) => Number(s.sell_amount) || 0) },
  ]), [series]);

  const monthlyOptions = useMemo(() => ({
    chart: { stacked: false, toolbar: { show: false } },
    xaxis: { categories: monthly.map((m: any) => m.ym) },
    colors: ["#0ea5e9", "#f59e0b"],
    dataLabels: { enabled: false },
    grid: { borderColor: "#eee" },
    yaxis: { labels: { formatter: (v: number) => new Intl.NumberFormat("fa-IR").format(Math.round(v)) } },
    legend: { position: "top" as const },
  }), [monthly]);
  const monthlySeries = useMemo(() => ([
    { name: "فروش", data: monthly.map((m: any) => Number(m.sell_amount) || 0) },
    { name: "خرید", data: monthly.map((m: any) => Number(m.buy_amount) || 0) },
  ]), [monthly]);

  const cashflowDays = useMemo(() => {
    const set = new Set<string>();
    for (const r of cashflow) set.add(r.day);
    return Array.from(set).sort();
  }, [cashflow]);
  const cashflowMethods = useMemo(() => {
    const set = new Set<string>();
    for (const r of cashflow) set.add(r.payment_method);
    return Array.from(set);
  }, [cashflow]);
  const cashflowSeries = useMemo(() => {
    return cashflowMethods.map((method) => ({
      name: method,
      data: cashflowDays.map((d) => {
        const found = cashflow.find((r: any) => r.day === d && r.payment_method === method);
        return found ? Number(found.amount) || 0 : 0;
      })
    }));
  }, [cashflow, cashflowMethods, cashflowDays]);
  const cashflowOptions = useMemo(() => ({
    chart: { stacked: true, toolbar: { show: false } },
    xaxis: { categories: cashflowDays },
    dataLabels: { enabled: false },
    grid: { borderColor: "#eee" },
    yaxis: { labels: { formatter: (v: number) => new Intl.NumberFormat("fa-IR").format(Math.round(v)) } },
    legend: { position: "top" as const },
  }), [cashflowDays]);

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader title="فیلتر گزارش" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">بازه تاریخ (شمسی)</label>
            <JalaliRangePicker
              className="w-full"
              value={{ from, to }}
              onChange={(r) => { setFrom(r.from || ""); setTo(r.to || ""); }}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">نوع</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as InvoiceTypeFilter)}
              className="w-full rounded-xl border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-teal-500 px-3 py-2 text-sm"
            >
              <option value="all">همه</option>
              <option value="sell">فروش</option>
              <option value="buy">خرید</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={fetchReports} disabled={loading} className="w-full">{loading ? "در حال بارگذاری..." : "اعمال"}</Button>
            <Button variant="outline" onClick={downloadCsv}>CSV</Button>
            <Button variant="outline" onClick={downloadExcel}>Excel</Button>
            <Button variant="outline" onClick={printView}>چاپ</Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-box">
        <div className="border-b border-gray-200 px-3 sm:px-4">
          <nav className="flex gap-4 overflow-x-auto">
            {[{k:'overview',t:'نمای کلی'},{k:'pnl',t:'سود و زیان'},{k:'arap',t:'دریافتنی/پرداختنی'},{k:'monthly',t:'ماهانه'},{k:'cashflow',t:'جریان نقدی'}].map((it:any)=> (
              <button key={it.k} onClick={()=>setTab(it.k)} className={`py-3 border-b-2 text-sm ${tab===it.k? 'border-teal-500 text-teal-600':'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                {it.t}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {tab === "overview" && (
        <>
          <div id="reports-print-root" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl shadow-box p-4">
              <div className="text-xs text-gray-500 mb-1">تعداد فاکتورها</div>
              <div className="text-2xl font-bold">{totals?.invoice_count ?? 0}</div>
            </div>
            <div className="bg-white rounded-2xl shadow-box p-4">
              <div className="text-xs text-gray-500 mb-1">مبلغ نهایی</div>
              <div className="text-2xl font-bold">{formatCurrency(totals?.final_amount ?? 0)}</div>
            </div>
            <div className="bg-white rounded-2xl shadow-box p-4">
              <div className="text-xs text-gray-500 mb-1">پرداخت‌شده</div>
              <div className="text-2xl font-bold">{totals?.paid_count ?? 0}</div>
            </div>
            <div className="bg-white rounded-2xl shadow-box p-4">
              <div className="text-xs text-gray-500 mb-1">در انتظار/جزئی</div>
              <div className="text-2xl font-bold">{(totals?.pending_count ?? 0) + (totals?.partial_count ?? 0)}</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-box p-4">
            <div className="font-semibold mb-3">روند روزانه</div>
            {typeof window !== "undefined" && (
              <ApexChart type="area" height={280} options={chartOptions as any} series={chartSeries as any} />
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-box p-4">
            <div className="font-semibold mb-3">روش‌های پرداخت</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {paymentMethods.map((pm) => (
                <div key={pm.payment_method} className="rounded-xl border p-4 hover:shadow-sm transition-shadow">
                  <div className="text-sm text-gray-600 mb-1">{pm.payment_method}</div>
                  <div className="text-lg font-bold">{formatCurrency(pm.amount)}</div>
                  <div className="text-xs text-gray-500">تعداد: {pm.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-box p-4">
            <div className="font-semibold mb-3">۱۰ مخاطب برتر</div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">نام</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">تعداد</th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">مجموع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {topContacts.map((c, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 text-sm">{c.name}</td>
                      <td className="px-3 py-2 text-sm">{c.invoice_count}</td>
                      <td className="px-3 py-2 text-sm">{formatCurrency(c.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-box p-4">
            <div className="font-semibold mb-3">سررسید مطالبات</div>
            {aging ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-gray-500 mb-1">۰-۳۰ روز</div>
                  <div className="text-lg font-bold">{formatCurrency(aging.bucket_0_30)}</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-gray-500 mb-1">۳۱-۶۰ روز</div>
                  <div className="text-lg font-bold">{formatCurrency(aging.bucket_31_60)}</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-gray-500 mb-1">۶۱-۹۰ روز</div>
                  <div className="text-lg font-bold">{formatCurrency(aging.bucket_61_90)}</div>
                </div>
                <div className="rounded-xl border p-4">
                  <div className="text-xs text-gray-500 mb-1">۹۰+ روز</div>
                  <div className="text-lg font-bold">{formatCurrency(aging.bucket_90_plus)}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">داده‌ای موجود نیست</div>
            )}
          </div>
        </>
      )}

      {tab === "pnl" && (
        <div className="bg-white rounded-2xl shadow-box p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border p-4">
              <div className="text-xs text-gray-500 mb-1">درآمد (فروش)</div>
              <div className="text-2xl font-bold">{formatCurrency(pnl?.revenue || 0)}</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-xs text-gray-500 mb-1">بهای تمام‌شده (خرید)</div>
              <div className="text-2xl font-bold">{formatCurrency(pnl?.cogs || 0)}</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-xs text-gray-500 mb-1">سود ناخالص</div>
              <div className="text-2xl font-bold">{formatCurrency((Number(pnl?.revenue||0) - Number(pnl?.cogs||0)) || 0)}</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-xs text-gray-500 mb-1">تخفیف‌ها</div>
              <div className="text-2xl font-bold">{formatCurrency(pnl?.discount_total || 0)}</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-xs text-gray-500 mb-1">مالیات</div>
              <div className="text-2xl font-bold">{formatCurrency(pnl?.tax_total || 0)}</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-xs text-gray-500 mb-1">سود تخمینی</div>
              <div className="text-2xl font-bold">{formatCurrency((Number(pnl?.revenue||0) - Number(pnl?.cogs||0) - Number(pnl?.discount_total||0) - Number(pnl?.tax_total||0)) || 0)}</div>
            </div>
          </div>
        </div>
      )}

      {tab === "arap" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-box p-4">
            <div className="text-xs text-gray-500 mb-1">دریافتنی‌ها</div>
            <div className="text-2xl font-bold">{formatCurrency(arap?.receivables || 0)}</div>
          </div>
          <div className="bg-white rounded-2xl shadow-box p-4">
            <div className="text-xs text-gray-500 mb-1">پرداختنی‌ها</div>
            <div className="text-2xl font-bold">{formatCurrency(arap?.payables || 0)}</div>
          </div>
        </div>
      )}

      {tab === "monthly" && (
        <div className="bg-white rounded-2xl shadow-box p-4">
          <div className="font-semibold mb-3">خلاصه ماهانه</div>
          {typeof window !== "undefined" && (
            <ApexChart type="bar" height={300} options={monthlyOptions as any} series={monthlySeries as any} />
          )}
        </div>
      )}

      {tab === "cashflow" && (
        <div className="bg-white rounded-2xl shadow-box p-4">
          <div className="font-semibold mb-3">جریان نقدی بر اساس روش پرداخت</div>
          {typeof window !== "undefined" && (
            <ApexChart type="bar" height={300} options={cashflowOptions as any} series={cashflowSeries as any} />
          )}
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-2xl shadow-box p-4">
        <div className="font-semibold mb-3">روند روزانه</div>
        {typeof window !== "undefined" && (
          <ApexChart type="area" height={280} options={chartOptions as any} series={chartSeries as any} />
        )}
      </div>

      {/* Payment methods */}
      <div className="bg-white rounded-2xl shadow-box p-4">
        <div className="font-semibold mb-3">روش‌های پرداخت</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {paymentMethods.map((pm) => (
            <div key={pm.payment_method} className="rounded-xl border p-4 hover:shadow-sm transition-shadow">
              <div className="text-sm text-gray-600 mb-1">{pm.payment_method}</div>
              <div className="text-lg font-bold">{formatCurrency(pm.amount)}</div>
              <div className="text-xs text-gray-500">تعداد: {pm.count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Top contacts */}
      <div className="bg-white rounded-2xl shadow-box p-4">
        <div className="font-semibold mb-3">۱۰ مخاطب برتر</div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">نام</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">تعداد</th>
                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">مجموع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {topContacts.map((c, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-sm">{c.name}</td>
                  <td className="px-3 py-2 text-sm">{c.invoice_count}</td>
                  <td className="px-3 py-2 text-sm">{formatCurrency(c.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Aging */}
      <div className="bg-white rounded-2xl shadow-box p-4">
        <div className="font-semibold mb-3">سررسید مطالبات</div>
        {aging ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500 mb-1">۰-۳۰ روز</div>
              <div className="text-lg font-bold">{formatCurrency(aging.bucket_0_30)}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500 mb-1">۳۱-۶۰ روز</div>
              <div className="text-lg font-bold">{formatCurrency(aging.bucket_31_60)}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500 mb-1">۶۱-۹۰ روز</div>
              <div className="text-lg font-bold">{formatCurrency(aging.bucket_61_90)}</div>
            </div>
            <div className="rounded-xl border p-4">
              <div className="text-xs text-gray-500 mb-1">۹۰+ روز</div>
              <div className="text-lg font-bold">{formatCurrency(aging.bucket_90_plus)}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">داده‌ای موجود نیست</div>
        )}
      </div>
    </div>
  );
}


