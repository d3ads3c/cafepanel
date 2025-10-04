"use client";
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface InvoiceItem {
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const invoiceType = searchParams.get('type') as 'buy' | 'sell' || 'sell';

  const [formData, setFormData] = useState({
    customer_supplier_name: '',
    customer_supplier_phone: '',
    customer_supplier_address: '',
    total_amount: 0,
    tax_amount: 0,
    discount_amount: 0,
    final_amount: 0,
    payment_method: 'cash' as 'cash' | 'card' | 'bank_transfer' | 'credit',
    payment_status: 'pending' as 'pending' | 'paid' | 'partial' | 'cancelled',
    notes: ''
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    { name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }
  ]);

  const [loading, setLoading] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        const perms: string[] = data?.data?.permissions || [];
        const allowed = Array.isArray(perms) && perms.includes('manage_accounting');
        setHasPermission(allowed);
        if (!allowed) {
          router.replace('/accounting');
        }
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermission(false);
      }
    };
    checkPermission();
  }, [router]);

  useEffect(() => {
    calculateTotals();
  }, [items]);

  const calculateTotals = () => {
    const total = items.reduce((sum, item) => sum + item.total_price, 0);
    const final = total + formData.tax_amount - formData.discount_amount;
    setFormData(prev => ({ ...prev, total_amount: total, final_amount: final }));
  };

  const addItem = () => {
    setItems([...items, { name: '', description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/accounting/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_type: invoiceType,
          ...formData,
          items: items.filter(item => item.name.trim() !== '')
        })
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        router.push('/accounting');
      } else {
        alert(data.message || 'خطا در ایجاد فاکتور');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('خطا در ایجاد فاکتور');
    } finally {
      setLoading(false);
    }
  };

  if (hasPermission === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!hasPermission) {
    return null;
  }

  return (
    <div className="xl:mt-0 mt-20">
      {/* Header */}
      <div className="h-[200px] w-full pt-14 bg-center bg-no-repeat bg-cover bg-[url('/img/HeadBG.png')] flex items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="rounded-2xl size-16 bg-gray-100 text-3xl flex items-center justify-center mx-auto">
            <i className={`fi fi-rr-${invoiceType === 'sell' ? 'receipt' : 'shopping-cart'} mt-1.5 text-teal-400`}></i>
          </div>
          <div>
            <h2 className="text-2xl text-white font-bold">
              {invoiceType === 'sell' ? 'فاکتور فروش جدید' : 'فاکتور خرید جدید'}
            </h2>
          </div>
        </div>
      </div>

      <div className="xl:px-0 p-5 min-h-[400px] w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer/Supplier Information */}
          <div className="bg-white rounded-lg shadow-box p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              اطلاعات {invoiceType === 'sell' ? 'مشتری' : 'تأمین‌کننده'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نام {invoiceType === 'sell' ? 'مشتری' : 'تأمین‌کننده'} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.customer_supplier_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_supplier_name: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">شماره تلفن</label>
                <input
                  type="tel"
                  value={formData.customer_supplier_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_supplier_phone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">آدرس</label>
                <textarea
                  value={formData.customer_supplier_address}
                  onChange={(e) => setFormData(prev => ({ ...prev, customer_supplier_address: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="bg-white rounded-lg shadow-box p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">آیتم‌های فاکتور</h3>
              <button
                type="button"
                onClick={addItem}
                className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
              >
                <i className="fi fi-rr-plus mr-2"></i>
                افزودن آیتم
              </button>
            </div>
            
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border border-gray-200 rounded-lg">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">نام آیتم *</label>
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={(e) => updateItem(index, 'name', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">تعداد</label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">قیمت واحد</label>
                    <input
                      type="number"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label className="block text-sm font-medium text-gray-700 mb-1">قیمت کل</label>
                    <input
                      type="number"
                      min="0"
                      value={item.total_price}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                    />
                  </div>
                  <div className="flex items-end">
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        <i className="fi fi-rr-trash"></i>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Information */}
          <div className="bg-white rounded-lg shadow-box p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">اطلاعات مالی</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مبلغ کل</label>
                <input
                  type="number"
                  min="0"
                  value={formData.total_amount}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مالیات</label>
                <input
                  type="number"
                  min="0"
                  value={formData.tax_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, tax_amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">تخفیف</label>
                <input
                  type="number"
                  min="0"
                  value={formData.discount_amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مبلغ نهایی</label>
                <input
                  type="number"
                  min="0"
                  value={formData.final_amount}
                  readOnly
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50 font-semibold"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">روش پرداخت</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="cash">نقدی</option>
                  <option value="card">کارت</option>
                  <option value="bank_transfer">انتقال بانکی</option>
                  <option value="credit">اعتباری</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">وضعیت پرداخت</label>
                <select
                  value={formData.payment_status}
                  onChange={(e) => setFormData(prev => ({ ...prev, payment_status: e.target.value as any }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="pending">در انتظار</option>
                  <option value="paid">پرداخت شده</option>
                  <option value="partial">جزئی</option>
                  <option value="cancelled">لغو شده</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">یادداشت</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'در حال ذخیره...' : 'ذخیره فاکتور'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
