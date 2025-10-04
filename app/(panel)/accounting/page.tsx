"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_type: 'buy' | 'sell';
  customer_supplier_name: string;
  customer_supplier_phone?: string;
  total_amount: number;
  final_amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit';
  payment_status: 'pending' | 'paid' | 'partial' | 'cancelled';
  notes?: string;
  created_at: string;
  created_by?: number;
}

export default function AccountingPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid' | 'partial' | 'cancelled'>('all');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        const perms: string[] = data?.data?.permissions || [];
        const allowed = Array.isArray(perms) && perms.includes('manage_accounting');
        setHasPermission(allowed);
        if (allowed) {
          fetchInvoices();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Permission check failed:', error);
        setLoading(false);
      }
    };
    checkPermission();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/accounting/invoices');
      const data = await res.json();
      if (res.ok && data.success) {
        setInvoices(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const typeMatch = filter === 'all' || invoice.invoice_type === filter;
    const statusMatch = statusFilter === 'all' || invoice.payment_status === statusFilter;
    return typeMatch && statusMatch;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    const statusLabels = {
      pending: 'در انتظار',
      paid: 'پرداخت شده',
      partial: 'جزئی',
      cancelled: 'لغو شده'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const typeClasses = {
      buy: 'bg-red-100 text-red-800',
      sell: 'bg-green-100 text-green-800'
    };
    const typeLabels = {
      buy: 'خرید',
      sell: 'فروش'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeClasses[type as keyof typeof typeClasses]}`}>
        {typeLabels[type as keyof typeof typeLabels]}
      </span>
    );
  };

  if (hasPermission === null || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">دسترسی غیرمجاز</h2>
          <p className="text-gray-600 mb-4">شما دسترسی لازم برای مشاهده این بخش را ندارید.</p>
          <button
            onClick={() => router.back()}
            className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors"
          >
            بازگشت
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => window.open('/accounting/invoices/new?type=sell', '_blank')}
            className="bg-green-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors flex items-center gap-2"
          >
            <i className="fi fi-rr-plus"></i>
            فاکتور فروش جدید
          </button>
          <button
            onClick={() => window.open('/accounting/invoices/new?type=buy', '_blank')}
            className="bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
          >
            <i className="fi fi-rr-plus"></i>
            فاکتور خرید جدید
          </button>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <div className="relative">
              <i className="fi fi-rr-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="جستجو در شماره فاکتور، نام مشتری/تأمین‌کننده..."
                className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("q") ?? "" : ""}
                onChange={(e) => {
                  const params = new URLSearchParams(window.location.search);
                  if (e.target.value) {
                    params.set("q", e.target.value);
                  } else {
                    params.delete("q");
                  }
                  router.replace(`?${params.toString()}`);
                }}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-box">
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">{filteredInvoices.length}</p>
              <p className="text-sm text-gray-600">کل فاکتورها</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-box p-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع فاکتور</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as 'all' | 'buy' | 'sell')}
                className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">همه</option>
                <option value="sell">فروش</option>
                <option value="buy">خرید</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت پرداخت</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">همه</option>
                <option value="pending">در انتظار</option>
                <option value="paid">پرداخت شده</option>
                <option value="partial">جزئی</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices List */}
        <div className="bg-white rounded-2xl shadow-box overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="text-center py-12">
              <i className="fi fi-rr-receipt text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 text-lg mb-2">
                {filter !== 'all' || statusFilter !== 'all' ? "نتیجه‌ای یافت نشد" : "هیچ فاکتوری ثبت نشده است"}
              </p>
              <p className="text-gray-400 text-sm">
                {filter !== 'all' || statusFilter !== 'all' ? "لطفاً فیلترها را تغییر دهید" : "برای شروع، فاکتور جدید ایجاد کنید"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">فاکتور</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">نوع</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">مخاطب</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">مبلغ کل</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">وضعیت پرداخت</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">تاریخ</th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-gray-700">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredInvoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            invoice.invoice_type === 'sell' ? 'bg-green-100' : 'bg-red-100'
                          }`}>
                            <i className={`fi fi-rr-receipt text-sm ${
                              invoice.invoice_type === 'sell' ? 'text-green-600' : 'text-red-600'
                            }`}></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">#{invoice.invoice_number}</p>
                            <p className="text-sm text-gray-500">{formatDate(invoice.created_at)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          invoice.invoice_type === 'sell' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {invoice.invoice_type === 'sell' ? 'فروش' : 'خرید'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div>
                          <p className="font-medium text-gray-800">{invoice.customer_supplier_name}</p>
                          {invoice.customer_supplier_phone && (
                            <p className="text-sm text-gray-500">{invoice.customer_supplier_phone}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-right">
                          <p className="font-medium text-gray-800">{formatCurrency(invoice.final_amount)}</p>
                          <p className="text-xs text-gray-500">تومان</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {getStatusBadge(invoice.payment_status)}
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm text-gray-600">{formatDate(invoice.created_at)}</p>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => window.open(`/accounting/invoices/${invoice.id}`, '_blank')}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="مشاهده"
                          >
                            <i className="fi fi-rr-eye text-sm"></i>
                          </button>
                          <button
                            onClick={() => window.open(`/accounting/invoices/${invoice.id}/edit`, '_blank')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="ویرایش"
                          >
                            <i className="fi fi-rr-edit text-sm"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <Toaster position="top-center" />
    </>
  );
}
