"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/useToast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import Drawer from "@/components/ui/Drawer";

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_type: "sell" | "buy";
  contact_name: string;
  total_amount: number;
  final_amount: number;
  payment_status: string;
  invoice_date: string;
  created_at: string;
  notes: string;
  items?: Array<{
    id: number;
    product_service: string;
    quantity: number;
    price: number;
    total_price: number;
    description?: string;
  }>;
}

export default function InvoicesPage() {
  const router = useRouter();
  const toast = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/accounting/invoices");
      if (!response.ok) throw new Error("Failed to fetch invoices");
      const data = await response.json();
      setInvoices(data.data || []);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      toast.error("خطا در بارگذاری فاکتورها");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا مطمئن هستید؟")) return;

    try {
      const response = await fetch(`/api/accounting/invoices/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete invoice");

      setInvoices(invoices.filter((inv) => inv.id !== id));
      toast.success("فاکتور حذف شد");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("خطا در حذف فاکتور");
    }
  };

  const formatPrice = (price: number) => {
    // Format with commas and handle decimals
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const openDrawer = async (invoice: Invoice) => {
    try {
      // If items already loaded, just open
      if (invoice.items) {
        setSelectedInvoice(invoice);
        setDrawerOpen(true);
        return;
      }
      const res = await fetch(`/api/accounting/invoices/${invoice.id}`);
      if (!res.ok) throw new Error("failed");
      const data = await res.json();
      const items = data?.data?.items || [];
      const enriched = { ...invoice, items };
      setSelectedInvoice(enriched);
      setDrawerOpen(true);
    } catch (e) {
      toast.error("خطا در دریافت جزئیات فاکتور");
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const search = searchTerm.toLowerCase();
    return (
      invoice.invoice_number.toLowerCase().includes(search) ||
      invoice.contact_name.toLowerCase().includes(search) ||
      invoice.invoice_type.toLowerCase().includes(search) ||
      invoice.payment_status.toLowerCase().includes(search)
    );
  });

  return (
    <div className="min-h-screen py-4 px-2">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
              مدیریت فاکتورها
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              ثبت و مدیریت فاکتورهای فروش و خرید
            </p>
          </div>
          <Button
            onClick={() => router.push("/accounting/invoices/new")}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md"
          >
            <svg
              className="w-5 h-5 ml-2 inline"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            فاکتور جدید
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="border border-gray-200">
          <Input
            type="text"
            placeholder="جستجو در شماره فاکتور، مخاطب، نوع یا وضعیت..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            rightIcon={
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />
        </Card>

        {/* Invoices Table - Desktop */}
        <Card className="overflow-hidden border border-gray-200 hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-center text-xs font-light text-gray-400">
                    شماره فاکتور
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-light text-gray-400">
                    نوع
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-light text-gray-400">
                    مخاطب
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-light text-gray-400">
                    مبلغ کل
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-light text-gray-400">
                    مبلغ نهایی
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-light text-gray-400">
                    وضعیت
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-light text-gray-400">
                    تاریخ
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-light text-gray-400">
                    عملیات
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-500 rounded-full animate-spin mb-2"></div>
                        در حال بارگذاری...
                      </div>
                    </td>
                  </tr>
                ) : filteredInvoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center">
                        <svg
                          className="w-16 h-16 text-gray-300 mb-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {searchTerm ? "نتیجه‌ای یافت نشد" : "فاکتوری یافت نشد"}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-100 text-center hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        <button
                          className="text-teal-600 hover:text-teal-800 font-semibold"
                          onClick={() => openDrawer(invoice)}
                        >
                          {invoice.invoice_number}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            invoice.invoice_type === "sell"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {invoice.invoice_type === "sell" ? "فروش" : "خرید"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {invoice.contact_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {formatPrice(invoice.total_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        {formatPrice(invoice.final_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            invoice.payment_status === "paid"
                              ? "bg-green-100 text-green-800 border border-green-200"
                              : invoice.payment_status === "partial"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                              : invoice.payment_status === "pending"
                              ? "bg-gray-100 text-gray-800 border border-gray-200"
                              : "bg-red-100 text-red-800 border border-red-200"
                          }`}
                        >
                          {invoice.payment_status === "paid" && "پرداخت شده"}
                          {invoice.payment_status === "partial" && "جزئی"}
                          {invoice.payment_status === "pending" && "در انتظار"}
                          {invoice.payment_status === "cancelled" && "لغو شده"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(invoice.invoice_date).toLocaleDateString(
                          "fa-IR"
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-5 justify-center">
                          <button
                            onClick={() =>
                              router.push(
                                `/accounting/invoices/${invoice.id}/edit`
                              )
                            }
                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDelete(invoice.id)}
                            className="text-red-600 hover:text-red-800 font-medium transition-colors"
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Invoices Cards - Mobile */}
        <div className="space-y-3 md:hidden">
          {loading ? (
            <Card className="border border-gray-200">
              <div className="flex flex-col items-center py-8 text-gray-500 text-sm">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-500 rounded-full animate-spin mb-2"></div>
                در حال بارگذاری...
              </div>
            </Card>
          ) : filteredInvoices.length === 0 ? (
            <Card className="border border-gray-200">
              <div className="flex flex-col items-center py-8 text-gray-500 text-sm">
                <svg
                  className="w-14 h-14 text-gray-300 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                {searchTerm ? "نتیجه‌ای یافت نشد" : "فاکتوری یافت نشد"}
              </div>
            </Card>
          ) : (
            filteredInvoices.map((invoice) => (
              <Card
                key={invoice.id}
                className="border border-gray-200 hover:border-teal-300 hover:shadow-sm transition-all"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <button
                        className="text-teal-600 hover:text-teal-800 font-semibold text-sm"
                        onClick={() => openDrawer(invoice)}
                      >
                        فاکتور #{invoice.invoice_number}
                      </button>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(invoice.invoice_date).toLocaleDateString(
                          "fa-IR"
                        )}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        invoice.invoice_type === "sell"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : "bg-blue-50 text-blue-700 border border-blue-100"
                      }`}
                    >
                      {invoice.invoice_type === "sell" ? "فروش" : "خرید"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span className="line-clamp-1">
                      {invoice.contact_name || "بدون مخاطب"}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                        invoice.payment_status === "paid"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : invoice.payment_status === "partial"
                          ? "bg-yellow-50 text-yellow-700 border border-yellow-100"
                          : invoice.payment_status === "pending"
                          ? "bg-gray-50 text-gray-700 border border-gray-100"
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}
                    >
                      {invoice.payment_status === "paid" && "پرداخت شده"}
                      {invoice.payment_status === "partial" && "جزئی"}
                      {invoice.payment_status === "pending" && "در انتظار"}
                      {invoice.payment_status === "cancelled" && "لغو شده"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-xs text-gray-600">
                      <p>مبلغ کل</p>
                      <p className="font-semibold text-gray-900 mt-0.5">
                        {formatPrice(invoice.total_amount)} تومان
                      </p>
                    </div>
                    <div className="text-xs text-gray-600 text-right">
                      <p>مبلغ نهایی</p>
                      <p className="font-semibold text-teal-700 mt-0.5">
                        {formatPrice(invoice.final_amount)} تومان
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
                    <button
                      onClick={() =>
                        router.push(
                          `/accounting/invoices/${invoice.id}/edit`
                        )
                      }
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(invoice.id)}
                      className="text-xs text-red-600 hover:text-red-800 font-medium"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        height={85}
        className="xl:w-[30%] mx-auto"
      >
        <div className="p-5 space-y-4">
          {selectedInvoice ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-teal-600">
                    جزئیات فاکتور
                  </p>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedInvoice.invoice_number}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedInvoice.contact_name || "بدون مشتری"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">مبلغ نهایی</p>
                  <p className="text-xl font-bold text-teal-700">
                    {formatPrice(selectedInvoice.final_amount)} تومان
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {selectedInvoice.invoice_type === "sell" ? "فروش" : "خرید"}{" "}
                    •{" "}
                    {new Date(selectedInvoice.invoice_date).toLocaleDateString(
                      "fa-IR"
                    )}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-sm text-gray-700">
                {selectedInvoice.notes}
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-800">
                  اقلام فاکتور
                </h4>
                {selectedInvoice.items && selectedInvoice.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedInvoice.items.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg border border-gray-200 flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.product_service}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.description || "بدون توضیح"}
                          </p>
                        </div>
                        <div className="text-right text-sm text-gray-700">
                          <p className="font-semibold">
                            {formatPrice(item.total_price)} تومان
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.quantity} × {formatPrice(item.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    آیتمی برای این فاکتور ثبت نشده است.
                  </p>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={()=>setDrawerOpen(false)}
                  className="w-full rounded-2xl border border-teal-600 text-teal-600 py-3 hover:bg-teal-600 hover:text-white duration-200"
                >
                  بستن
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-center text-gray-500 text-sm">
                در حال بارگذاری...
              </p>
              <div>
                <button
                  type="button"
                  onClick={()=>setDrawerOpen(false)}
                  className="w-full rounded-2xl border border-teal-600 text-teal-600 py-3 hover:bg-teal-600 hover:text-white duration-200"
                >
                  بستن
                </button>
              </div>
            </>
          )}
        </div>
      </Drawer>
    </div>
  );
}
