"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/lib/useToast";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  discount_type?: 'percent' | 'amount' | null;
  discount_value?: number | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
  last_order_date?: string;
  unpaid_count?: number;
  unpaid_total?: number;
}

export default function CustomersPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 20;
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    notes: "",
    discount_type: '' as '' | 'percent' | 'amount',
    discount_value: '' as string | number,
  });
  const [unpaidModalOpen, setUnpaidModalOpen] = useState(false);
  const [unpaidLoading, setUnpaidLoading] = useState(false);
  const [unpaidCustomerName, setUnpaidCustomerName] = useState<string>("");
  const [unpaidOrders, setUnpaidOrders] = useState<Array<{ id: number; createdAt: string; items: Array<{ item_name: string; quantity: number; item_price: number | string; }> }>>([]);
  const [markingPaidOrderId, setMarkingPaidOrderId] = useState<number | null>(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data);
      } else {
        showError("خطا در دریافت اطلاعات مشتریان");
      }
    } catch (error) {
      console.error("Error fetching customers");
      showError("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim() || !form.phone.trim()) {
      showError("نام و شماره تلفن الزامی است");
      return;
    }

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";
      
      const submitData = {
        ...form,
        discount_value: form.discount_type ? (typeof form.discount_value === 'string' ? form.discount_value.replace(/,/g, '') : form.discount_value) : 0
      };
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      const result = await res.json();
      
      if (result.success) {
        showSuccess(editingCustomer ? "مشتری با موفقیت ویرایش شد" : "مشتری جدید با موفقیت اضافه شد");
        setDialogOpen(false);
        setEditingCustomer(null);
        setForm({ name: "", phone: "", email: "", address: "", notes: "", discount_type: '', discount_value: "" });
        fetchCustomers();
      } else {
        showError(result.message || "خطا در ذخیره اطلاعات");
      }
    } catch (error) {
      console.error("Error saving customer");
      showError("خطا در ارتباط با سرور");
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || "",
      discount_type: (customer.discount_type as any) || '',
      discount_value: customer.discount_value || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این مشتری را حذف کنید؟")) {
      return;
    }

    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const result = await res.json();
      
      if (result.success) {
        showSuccess("مشتری با موفقیت حذف شد");
        fetchCustomers();
      } else {
        showError(result.message || "خطا در حذف مشتری");
      }
    } catch (error) {
      console.error("Error deleting customer");
      showError("خطا در ارتباط با سرور");
    }
  };

  const resetForm = () => {
    setForm({ name: "", phone: "", email: "", address: "", notes: "", discount_type: '', discount_value: '' });
    setEditingCustomer(null);
    setDialogOpen(false);
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    const rounded = Math.round(Number.isNaN(numPrice) ? 0 : numPrice);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const handlePrintUnpaid = () => {
    const unpaidCustomers = customers.filter(c => (c.unpaid_total || 0) > 0 || (c.unpaid_count || 0) > 0);
    const totalUnpaidSum = unpaidCustomers.reduce((sum, c) => sum + (c.unpaid_total || 0), 0);
    const totalUnpaidCount = unpaidCustomers.reduce((sum, c) => sum + (c.unpaid_count || 0), 0);

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (!printWindow) return;

    const rowsHtml = unpaidCustomers.map(c => `
      <tr>
        <td class="name">${c.name}</td>
        <td class="count">${c.unpaid_count || 0}</td>
        <td class="amount">${formatPrice(c.unpaid_total || 0)} تومان</td>
      </tr>
    `).join('');

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <title>گزارش بدهکارها</title>
          <style>
            @media print {
              @page { margin: 0; width: 80mm; }
              body { margin: 0; width: 74mm; }
            }
            body { font-family: Tahoma, Arial, sans-serif; direction: rtl; color: #000; background: #fff; padding: 8px; }
            .header { text-align: center; margin-bottom: 8px; }
            .title { font-weight: 700; font-size: 14px; }
            .sub { font-size: 11px; color: #000; }
            .divider { border-bottom: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 6px 4px; font-size: 11px; text-align: right; border-bottom: 1px solid #000; }
            th { font-weight: 700; }
            tr:last-child td { border-bottom: none; }
            .name { width: 50%; word-break: break-word; }
            .count { width: 20%; text-align: center; }
            .amount { width: 30%; text-align: left; }
            .totals { margin-top: 8px; font-weight: 700; font-size: 12px; display: flex; justify-content: space-between; }
            .footer { text-align: center; margin-top: 8px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">گزارش مشتریان بدهکار</div>
            <div class="sub">${new Date().toLocaleString('fa-IR')}</div>
          </div>
          <div class="divider"></div>
          <table>
            <thead>
              <tr>
                <th>نام مشتری</th>
                <th>تعداد بدهی</th>
                <th>مبلغ بدهی</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="3" style="text-align:center">هیچ بدهی ثبت نشده است</td></tr>'}
            </tbody>
          </table>
          <div class="totals">
            <span>مجموع بدهی‌ها: ${formatPrice(totalUnpaidSum)} تومان</span>
            <span>کل سفارشات بدهکار: ${totalUnpaidCount}</span>
          </div>
          <div class="divider"></div>
          <div class="footer">چاپ از پنل مشتریان</div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => window.close(), 500); };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const openUnpaidItemsModal = async (customerName: string) => {
    setUnpaidCustomerName(customerName);
    setUnpaidLoading(true);
    setUnpaidModalOpen(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        const orders = (data.data as any[])
          .filter(o => (o.customerName || '') === customerName)
          .filter(o => (!o.paymentMethod || o.paymentMethod === '') && o.status !== 'cancelled');
        setUnpaidOrders(orders.map(o => ({ id: o.id, createdAt: o.createdAt, items: o.items || [] })));
      } else {
        showError('خطا در دریافت سفارشات بدهکار');
      }
    } catch (e) {
      showError('خطا در ارتباط با سرور');
    } finally {
      setUnpaidLoading(false);
    }
  };

  const markOrderAsPaid = async (orderId: number) => {
    setMarkingPaidOrderId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'پرداختی' })
      });
      const result = await res.json();
      if (result.success) {
        showSuccess('سفارش به عنوان پرداختی علامت گذاری شد');
        setUnpaidOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        showError('خطا در بروزرسانی سفارش');
      }
    } catch (error) {
      console.error('Error marking order as paid');
      showError('خطا در ارتباط با سرور');
    } finally {
      setMarkingPaidOrderId(null);
    }
  };

  return (
    <div className="min-h-screen py-4 px-2 sm:px-6">
      <div className="mx-auto">
        {/* Header */}
        <div className="mb-8 pt-20 xl:pt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="sm:text-2xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
                مدیریت مشتریان
              </h1>
              <p className="text-gray-500 text-xs">مدیریت اطلاعات مشتریان و تاریخچه سفارشات</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintUnpaid}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-gray-700 font-medium border border-gray-200 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-all duration-200 shadow-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4H9a2 2 0 00-2 2v2a2 2 0 002 2h10a2 2 0 002-2v-2a2 2 0 00-2-2h-1m-2-4H9v2a2 2 0 002 2h2a2 2 0 002-2v-2" />
                </svg>
                چاپ بدهکارها
              </button>
              <button
                onClick={() => setDialogOpen(true)}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                مشتری جدید
              </button>
            </div>
          </div>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          <div className="lg:col-span-3">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="جستجو در نام، شماره تلفن یا ایمیل..."
                className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-gray-200 rounded-xl focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
              {customers.length}
            </p>
            <p className="text-sm text-gray-600 mt-1">کل مشتریان</p>
          </div>
        </div>

        {/* Customers Table/Cards */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-600">در حال بارگذاری...</p>
              </div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 6a3 3 0 11-6 0 3 3 0 016 0zM6 20h12a6 6 0 00-6-6 6 6 0 00-6 6z" />
              </svg>
              <p className="text-gray-600 font-medium mb-2">
                {searchTerm ? "نتیجه‌ای یافت نشد" : "هیچ مشتری ثبت نشده است"}
              </p>
              <p className="text-gray-400 text-sm">
                {searchTerm ? "لطفاً عبارت جستجو را تغییر دهید" : "برای شروع، مشتری جدید اضافه کنید"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="md:hidden divide-y divide-gray-100 p-4 space-y-4">
                {paginatedCustomers.map((customer) => (
                  <div key={customer.id} className="bg-white p-2 space-y-3 hover:shadow-md transition-shadow">
                    {/* Header with name and actions */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                          <p className="text-xs text-gray-500">{customer.phone}</p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          title="ویرایش"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="حذف"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Contact Info */}
                    {customer.email && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium">ایمیل</p>
                        <p className="text-sm text-gray-900 truncate">{customer.email}</p>
                      </div>
                    )}
                    
                    {customer.address && (
                      <div>
                        <p className="text-xs text-gray-500 font-medium">آدرس</p>
                        <p className="text-sm text-gray-900 line-clamp-2">{customer.address}</p>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                      <div className="bg-white rounded-lg p-2 text-center">
                        <p className="font-bold text-gray-900 text-lg">{customer.total_orders}</p>
                        <p className="text-xs text-gray-500">سفارشات</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center">
                        <p className="font-bold text-teal-600 text-lg">{formatPrice(customer.total_spent)}</p>
                        <p className="text-xs text-gray-500">خرید</p>
                      </div>
                      <div className="bg-white rounded-lg p-2 text-center">
                        <p className={`font-bold text-lg ${customer.unpaid_total && customer.unpaid_total > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                          {customer.unpaid_count || 0}
                        </p>
                        <p className="text-xs text-gray-500">بدهکار</p>
                      </div>
                    </div>

                    {/* Unpaid Orders Button */}
                    {customer.unpaid_count && customer.unpaid_count > 0 && (
                      <button
                        onClick={() => openUnpaidItemsModal(customer.name)}
                        className="w-full bg-red-50 text-red-600 hover:bg-red-100 text-xs font-medium py-2 rounded-lg transition-colors"
                      >
                        {customer.unpaid_count} سفارش بدهکار
                      </button>
                    )}

                    {/* Last Order Date */}
                    {customer.last_order_date && (
                      <p className="text-xs text-gray-500 text-center pt-1 border-t border-gray-100">
                        آخرین سفارش: {formatDate(customer.last_order_date)}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-gray-700 uppercase">مشتری</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-gray-700 uppercase">تماس</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-gray-700 uppercase">سفارشات</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-gray-700 uppercase">مجموع خرید</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-gray-700 uppercase">بدهکار</th>
                      <th className="text-right py-4 px-6 text-xs font-semibold text-gray-700 uppercase">آخرین سفارش</th>
                      <th className="text-center py-4 px-6 text-xs font-semibold text-gray-700 uppercase">عملیات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {paginatedCustomers.map((customer) => (
                      <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-50 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{customer.name}</p>
                              {customer.email && (
                                <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-900">{customer.phone}</p>
                            {customer.address && (
                              <p className="text-xs text-gray-500 truncate mt-1">{customer.address}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{customer.total_orders}</p>
                            <p className="text-xs text-gray-500">سفارش</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">{formatPrice(customer.total_spent)}</p>
                            <p className="text-xs text-gray-500">تومان</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-right">
                            <p className={`font-semibold ${customer.unpaid_total && customer.unpaid_total > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                              {formatPrice(customer.unpaid_total || 0)}
                            </p>
                            <button
                              disabled={!(customer.unpaid_count && customer.unpaid_count > 0)}
                              onClick={() => openUnpaidItemsModal(customer.name)}
                              className={`text-xs mt-1 ${customer.unpaid_count && customer.unpaid_count > 0 ? 'text-teal-600 hover:text-teal-700 font-medium' : 'text-gray-400'}`}
                            >
                              {(customer.unpaid_count || 0)} سفارش
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-sm text-gray-600">
                            {customer.last_order_date ? formatDate(customer.last_order_date) : "ندارد"}
                          </p>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(customer)}
                              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                              title="ویرایش"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(customer.id)}
                              className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                              title="حذف"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Pagination */}
        {filteredCustomers.length > 0 && totalPages > 1 && (
          <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm mt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                نمایش {startIndex + 1} تا {Math.min(endIndex, filteredCustomers.length)} از {filteredCustomers.length} مشتری
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  قبلی
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                          currentPage === pageNum
                            ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white'
                            : 'border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  بعدی
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Customer Form Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-teal-50 to-teal-25 border-b border-gray-200 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingCustomer ? "ویرایش مشتری" : "مشتری جدید"}
                </h3>
                <p className="text-xs text-gray-600 mt-1">
                  {editingCustomer ? "بروزرسانی اطلاعات مشتری" : "افزودن مشتری جدید به سیستم"}
                </p>
              </div>
              <button
                onClick={resetForm}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="نام کامل مشتری"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    شماره تلفن *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="09123456789"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  ایمیل
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="customer@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  آدرس
                </label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all resize-none"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="آدرس کامل مشتری"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  یادداشت
                </label>
                <textarea
                  rows={2}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all resize-none"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="یادداشت‌های اضافی..."
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-800 mb-3">
                  تخفیف پیش‌فرض مشتری (اختیاری)
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                    value={form.discount_type}
                    onChange={(e) => setForm({ ...form, discount_type: e.target.value as any })}
                  >
                    <option value="">بدون تخفیف</option>
                    <option value="percent">درصد (%)</option>
                    <option value="amount">مبلغ (تومان)</option>
                  </select>
                  <input
                    type="text"
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all disabled:opacity-50"
                    value={form.discount_value as any}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (form.discount_type === 'amount') {
                        // Remove commas and format with commas
                        const numericValue = value.replace(/,/g, '');
                        const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        setForm({ ...form, discount_value: formatted });
                      } else {
                        setForm({ ...form, discount_value: value });
                      }
                    }}
                    placeholder={form.discount_type === 'percent' ? 'مثال: 10 برای 10%' : 'مثال: 5000 برای ۵,۰۰۰ تومان'}
                    disabled={!form.discount_type}
                  />
                  <div className="flex items-center text-xs text-gray-600 bg-blue-50 rounded-lg px-3 py-2">
                    {form.discount_type === 'percent' && '💡 بر روی مجموع سفارش'}
                    {form.discount_type === 'amount' && '💡 از مجموع سفارش کسر'}
                    {!form.discount_type && '💡 بدون تخفیف خودکار'}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 text-gray-700 font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-teal-500 to-teal-600 text-white font-semibold rounded-lg hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
                >
                  {editingCustomer ? "ویرایش" : "افزودن"} مشتری
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Unpaid Orders Modal */}
      {unpaidModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 border-b border-gray-200 px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">سفارشات بدهکار</h3>
                <p className="text-xs text-gray-600 mt-1">{unpaidCustomerName}</p>
              </div>
              <button onClick={() => setUnpaidModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              {unpaidLoading ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-600">در حال بارگذاری...</p>
                </div>
              ) : unpaidOrders.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-gray-600 font-medium">سفارشی یافت نشد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {unpaidOrders.map(order => (
                    <div key={order.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div className="font-semibold text-gray-900">سفارش #{order.id}</div>
                        <div className="text-xs text-gray-600">{new Date(order.createdAt).toLocaleString('fa-IR')}</div>
                      </div>
                      <div className="p-4">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-600 text-xs border-b border-gray-100">
                              <th className="text-right py-2 font-semibold">نام کالا</th>
                              <th className="text-center py-2 font-semibold">تعداد</th>
                              <th className="text-left py-2 font-semibold">قیمت</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((it, idx) => (
                              <tr key={idx} className="border-t border-gray-100">
                                <td className="py-2 pr-1 text-gray-900">{it.item_name}</td>
                                <td className="py-2 text-center text-gray-900">{it.quantity}</td>
                                <td className="py-2 pl-1 text-left text-gray-900 font-medium">{formatPrice(it.item_price)} تومان</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={() => markOrderAsPaid(order.id)}
                          disabled={markingPaidOrderId === order.id}
                          className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {markingPaidOrderId === order.id ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              در حال پردازش...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                             پرداخت شده
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
