"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface InvoiceItem {
  id: number;
  item_name: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  invoice_type: 'buy' | 'sell';
  customer_supplier_name: string;
  customer_supplier_phone?: string;
  customer_supplier_address?: string;
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  final_amount: number;
  payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit';
  payment_status: 'pending' | 'paid' | 'partial' | 'cancelled';
  notes?: string;
  created_at: string;
  created_by_name?: string;
  items: InvoiceItem[];
}

export default function InvoiceViewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
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
          fetchInvoice();
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

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/accounting/invoices/${params.id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setInvoice(data.data);
      } else {
        alert(data.message || 'خطا در دریافت فاکتور');
        router.push('/accounting');
      }
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
      alert('خطا در دریافت فاکتور');
      router.push('/accounting');
    } finally {
      setLoading(false);
    }
  };

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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses[status as keyof typeof statusClasses]}`}>
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${typeClasses[type as keyof typeof typeClasses]}`}>
        {typeLabels[type as keyof typeof typeLabels]}
      </span>
    );
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      cash: 'نقدی',
      card: 'کارت',
      bank_transfer: 'انتقال بانکی',
      credit: 'اعتباری'
    };
    return labels[method as keyof typeof labels];
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

  if (!invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-gray-500 text-6xl mb-4">📄</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">فاکتور یافت نشد</h2>
          <button
            onClick={() => router.push('/accounting')}
            className="bg-teal-500 text-white px-6 py-2 rounded-lg hover:bg-teal-600 transition-colors"
          >
            بازگشت به حسابداری
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="xl:mt-0 mt-20">
      {/* Header */}
      <div className="h-[200px] w-full pt-14 bg-center bg-no-repeat bg-cover bg-[url('/img/HeadBG.png')] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="rounded-2xl size-16 bg-gray-100 text-3xl flex items-center justify-center mx-auto">
            <i className="fi fi-rr-document mt-1.5 text-teal-400"></i>
          </div>
          <div>
            <h2 className="text-2xl text-white font-bold">مشاهده فاکتور</h2>
            <p className="text-white/80">{invoice.invoice_number}</p>
          </div>
        </div>
      </div>

      <div className="xl:px-0 p-5 min-h-[400px] w-full">
        {/* Invoice Header */}
        <div className="bg-white rounded-lg shadow-box p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-800">فاکتور {invoice.invoice_number}</h3>
              <p className="text-gray-600">تاریخ: {formatDate(invoice.created_at)}</p>
            </div>
            <div className="text-left">
              {getTypeBadge(invoice.invoice_type)}
              <div className="mt-2">
                {getStatusBadge(invoice.payment_status)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">
                اطلاعات {invoice.invoice_type === 'sell' ? 'مشتری' : 'تأمین‌کننده'}
              </h4>
              <div className="space-y-1">
                <p><span className="font-medium">نام:</span> {invoice.customer_supplier_name}</p>
                {invoice.customer_supplier_phone && (
                  <p><span className="font-medium">تلفن:</span> {invoice.customer_supplier_phone}</p>
                )}
                {invoice.customer_supplier_address && (
                  <p><span className="font-medium">آدرس:</span> {invoice.customer_supplier_address}</p>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">اطلاعات پرداخت</h4>
              <div className="space-y-1">
                <p><span className="font-medium">روش پرداخت:</span> {getPaymentMethodLabel(invoice.payment_method)}</p>
                <p><span className="font-medium">وضعیت:</span> {getStatusBadge(invoice.payment_status)}</p>
                {invoice.created_by_name && (
                  <p><span className="font-medium">ایجاد شده توسط:</span> {invoice.created_by_name}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Items */}
        <div className="bg-white rounded-lg shadow-box p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">آیتم‌های فاکتور</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نام آیتم</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">توضیحات</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تعداد</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">قیمت واحد</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">قیمت کل</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoice.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.item_name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {item.item_description || '-'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.quantity}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.unit_price)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="bg-white rounded-lg shadow-box p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">خلاصه فاکتور</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">مبلغ کل:</span>
              <span className="font-medium">{formatCurrency(invoice.total_amount)}</span>
            </div>
            {invoice.tax_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">مالیات:</span>
                <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
              </div>
            )}
            {invoice.discount_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">تخفیف:</span>
                <span className="font-medium text-red-600">-{formatCurrency(invoice.discount_amount)}</span>
              </div>
            )}
            <hr className="border-gray-200" />
            <div className="flex justify-between text-lg font-bold">
              <span>مبلغ نهایی:</span>
              <span className="text-teal-600">{formatCurrency(invoice.final_amount)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="bg-white rounded-lg shadow-box p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">یادداشت</h3>
            <p className="text-gray-700">{invoice.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-end">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            بازگشت
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <i className="fi fi-rr-print mr-2"></i>
            چاپ
          </button>
        </div>
      </div>
    </div>
  );
}
