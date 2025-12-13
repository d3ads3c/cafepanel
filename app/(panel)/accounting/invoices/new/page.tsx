"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/lib/useToast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import JalaliDatePicker from "@/components/ui/JalaliDatePicker";

interface Contact {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  contact_type: "supplier" | "customer" | "other";
}

interface InvoiceItem {
  id: number;
  product_service: string;
  quantity: number | string;
  price: number | string;
  total_price: number;
  description: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { success: showSuccess, error: showError } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [invoiceType, setInvoiceType] = useState<"sell" | "buy" | null>(null);
  const [autoInvoiceNumber, setAutoInvoiceNumber] = useState(true);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [invoiceDate, setInvoiceDate] = useState<string>(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [discountType, setDiscountType] = useState<"percent" | "amount">("amount");
  const [discount, setDiscount] = useState("");
  const [taxType, setTaxType] = useState<"percent" | "amount">("amount");
  const [tax, setTax] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchContacts();
    generateAutoInvoiceNumber();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoadingContacts(true);
      const response = await fetch("/api/accounting/contacts");
      if (!response.ok) throw new Error("Failed to fetch contacts");
      const data = await response.json();
      setContacts(data.data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      showError("خطا در بارگذاری مخاطبین");
    } finally {
      setLoadingContacts(false);
    }
  };

  const generateAutoInvoiceNumber = async () => {
    try {
      const response = await fetch("/api/accounting/invoices");
      if (!response.ok) throw new Error("Failed to fetch invoices");
      const data = await response.json();
      const invoices = data.data || [];
      const maxNumber = invoices.reduce((max: number, inv: any) => {
        const num = parseInt(inv.invoice_number) || 0;
        return num > max ? num : max;
      }, 0);
      setInvoiceNumber(String(maxNumber + 1));
    } catch (error) {
      console.error("Error generating invoice number:", error);
      setInvoiceNumber("1");
    }
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now(),
      product_service: "",
      quantity: 1,
      price: 0,
      total_price: 0,
      description: ""
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Helper function to validate and convert to English numbers only
  const validateEnglishNumber = (value: string): string => {
    // Remove all non-numeric characters except decimal point
    return value.replace(/[^\d.]/g, '').replace(/\./g, (match, offset, string) => {
      // Only allow one decimal point
      return string.indexOf('.') === offset ? match : '';
    });
  };

  const updateItem = (id: number, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          // Convert to number for calculation
          const quantity = parseFloat(updated.quantity.toString()) || 0;
          const price = parseFloat(updated.price.toString()) || 0;
          updated.total_price = quantity * price;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleQuantityChange = (id: number, value: string) => {
    const englishValue = validateEnglishNumber(value);
    updateItem(id, 'quantity', englishValue);
  };

  const handlePriceChange = (id: number, value: string) => {
    const englishValue = validateEnglishNumber(value);
    updateItem(id, 'price', englishValue);
  };

  const calculateTotals = () => {
    const totalAmount = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity.toString()) || 0;
      const price = parseFloat(item.price.toString()) || 0;
      return sum + (quantity * price);
    }, 0);
    let discountAmount = 0;
    let taxAmount = 0;

    if (discount) {
      const discountValue = parseFloat(discount) || 0;
      if (discountType === "percent") {
        discountAmount = (totalAmount * discountValue) / 100;
      } else {
        discountAmount = discountValue;
      }
    }

    const amountAfterDiscount = totalAmount - discountAmount;

    if (tax) {
      const taxValue = parseFloat(tax) || 0;
      if (taxType === "percent") {
        taxAmount = (amountAfterDiscount * taxValue) / 100;
      } else {
        taxAmount = taxValue;
      }
    }

    return {
      totalAmount,
      discountAmount,
      taxAmount,
      finalAmount: amountAfterDiscount + taxAmount
    };
  };

  const checkDuplicateInvoiceNumber = async (number: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/accounting/invoices");
      if (!response.ok) return false;
      const data = await response.json();
      const invoices = data.data || [];
      return invoices.some((inv: any) => inv.invoice_number === number);
    } catch (error) {
      console.error("Error checking duplicate:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invoiceType) {
      showError("لطفا نوع فاکتور را انتخاب کنید");
      return;
    }

    if (!selectedContact) {
      showError("لطفا مخاطب را انتخاب کنید");
      return;
    }

    if (!invoiceNumber) {
      showError("لطفا شماره فاکتور را وارد کنید");
      return;
    }

    // Check for duplicate invoice number
    const isDuplicate = await checkDuplicateInvoiceNumber(invoiceNumber);
    if (isDuplicate) {
      showError("شماره فاکتور تکراری است. لطفا شماره دیگری انتخاب کنید");
      return;
    }

    if (items.length === 0) {
      showError("لطفا حداقل یک آیتم به فاکتور اضافه کنید");
      return;
    }

    // Validate all items
    for (const item of items) {
      const quantity = parseFloat(item.quantity.toString()) || 0;
      const price = parseFloat(item.price.toString()) || 0;
      if (!item.product_service || quantity <= 0 || price <= 0) {
        showError("لطفا تمام فیلدهای آیتم‌ها را به درستی پر کنید");
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const totals = calculateTotals();
      const discountValue = parseFloat(discount) || 0;
      const taxValue = parseFloat(tax) || 0;

      // Format date to YYYY-MM-DD (remove time if present)
      const formattedInvoiceDate = invoiceDate.includes('T') 
        ? invoiceDate.split('T')[0] 
        : invoiceDate;

      const response = await fetch("/api/accounting/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          invoice_type: invoiceType,
          contact_id: selectedContact.id,
          contact_name: selectedContact.name,
          total_amount: totals.totalAmount,
          discount_type: discountType,
          discount_value: discountValue,
          tax_type: taxType,
          tax_value: taxValue,
          final_amount: totals.finalAmount,
          invoice_date: formattedInvoiceDate,
          notes: notes || null,
          items: items.map(item => ({
            product_service: item.product_service,
            quantity: parseFloat(item.quantity.toString()) || 0,
            price: parseFloat(item.price.toString()) || 0,
            total_price: item.total_price,
            description: item.description || null,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "خطا در ثبت فاکتور");
      }

      showSuccess("فاکتور با موفقیت ثبت شد");
      router.push("/accounting/invoices");
    } catch (error: any) {
      console.error("Error submitting invoice:", error);
      showError(error.message || "خطا در ثبت فاکتور");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totals = calculateTotals();
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
    (contact.phone && contact.phone.includes(contactSearchTerm)) ||
    (contact.email && contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">ایجاد فاکتور جدید</h1>
            <p className="text-gray-500 text-sm mt-1">فاکتور فروش یا خرید جدید ایجاد کنید</p>
          </div>
          <Link
            href="/accounting/invoices"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-gray-700 text-sm font-medium border border-gray-200 hover:border-teal-400 hover:text-teal-600 hover:bg-teal-50 transition-all duration-200 shadow-sm"
          >
            بازگشت
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Invoice Type Selection */}
          {!invoiceType && (
            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">نوع فاکتور را انتخاب کنید</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setInvoiceType("sell")}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all text-right"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">فاکتور فروش</h3>
                      <p className="text-sm text-gray-600">فاکتور برای فروش محصولات یا خدمات</p>
                    </div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceType("buy")}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-right"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 mb-2">فاکتور خرید</h3>
                      <p className="text-sm text-gray-600">فاکتور برای خرید محصولات یا خدمات</p>
                    </div>
                  </div>
                </button>
              </div>
            </Card>
          )}

          {invoiceType && (
            <>
              {/* Basic Information */}
              <Card className="p-6 space-y-4">
                <h2 className="text-lg font-bold text-gray-800 mb-4">اطلاعات پایه</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Invoice Number */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      شماره فاکتور
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={autoInvoiceNumber}
                          onChange={(e) => {
                            setAutoInvoiceNumber(e.target.checked);
                            if (e.target.checked) {
                              generateAutoInvoiceNumber();
                            }
                          }}
                          className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                        خودکار
                      </label>
                    </div>
                    <Input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      disabled={autoInvoiceNumber}
                      placeholder="شماره فاکتور"
                      required
                      className="mt-2"
                    />
                  </div>

                  {/* Invoice Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      تاریخ فاکتور
                    </label>
                    <JalaliDatePicker
                      value={invoiceDate}
                      onChange={(date) => setInvoiceDate(date)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Contact Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    مخاطب
                  </label>
                  {selectedContact ? (
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                          <i className="fi fi-rr-user text-teal-600"></i>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-800">{selectedContact.name}</h3>
                          {selectedContact.phone && (
                            <p className="text-sm text-gray-600">{selectedContact.phone}</p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsContactModalOpen(true)}
                        className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        تغییر
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsContactModalOpen(true)}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-all text-right"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">انتخاب مخاطب</span>
                        <i className="fi fi-rr-user text-gray-400"></i>
                      </div>
                    </button>
                  )}
                </div>
              </Card>

              {/* Items Table */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">آیتم‌های فاکتور</h2>
                  <Button
                    type="button"
                    onClick={addItem}
                    className="bg-teal-500 hover:bg-teal-600 text-white"
                  >
                    + افزودن آیتم
                  </Button>
                </div>

                {items.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>هیچ آیتمی اضافه نشده است</p>
                    <p className="text-sm mt-2">برای شروع، یک آیتم اضافه کنید</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">#</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">محصول/خدمت</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">تعداد</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">قیمت واحد</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">قیمت کل</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">توضیحات</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">عملیات</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item, index) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3">
                              <Input
                                type="text"
                                value={item.product_service}
                                onChange={(e) => updateItem(item.id, 'product_service', e.target.value)}
                                placeholder="نام محصول یا خدمت"
                                required
                                className="min-w-[200px]"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="text"
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                placeholder="0"
                                required
                                className="w-24"
                                dir="ltr"
                                inputMode="decimal"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="text"
                                value={item.price}
                                onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                placeholder="0"
                                required
                                className="w-32"
                                dir="ltr"
                                inputMode="decimal"
                              />
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {item.total_price.toLocaleString()} تومان
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                type="text"
                                value={item.description}
                                onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                                placeholder="توضیحات (اختیاری)"
                                className="min-w-[200px]"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-red-600 hover:text-red-800 transition-colors"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              {/* Discount and Tax */}
              <Card className="p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">تخفیف و مالیات</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Discount */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      تخفیف
                    </label>
                  <div className="flex gap-2">
                    <select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as "percent" | "amount")}
                      className="rounded-xl px-4 py-2 text-sm border border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    >
                      <option value="amount">مبلغ</option>
                      <option value="percent">درصد</option>
                    </select>
                    <Input
                      type="text"
                      value={discount}
                      onChange={(e) => setDiscount(validateEnglishNumber(e.target.value))}
                      placeholder="0"
                      className="flex-1"
                      dir="ltr"
                      inputMode="decimal"
                    />
                  </div>
                    {discount && (
                      <p className="text-xs text-gray-500 mt-1">
                        مبلغ تخفیف: {discountType === "percent" 
                          ? `${discount}% = ${calculateTotals().discountAmount.toLocaleString()} تومان`
                          : `${parseFloat(discount).toLocaleString()} تومان`}
                      </p>
                    )}
                  </div>

                  {/* Tax */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                      مالیات
                    </label>
                  <div className="flex gap-2">
                    <select
                      value={taxType}
                      onChange={(e) => setTaxType(e.target.value as "percent" | "amount")}
                      className="rounded-xl px-4 py-2 text-sm border border-gray-300 bg-gray-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                    >
                      <option value="amount">مبلغ</option>
                      <option value="percent">درصد</option>
                    </select>
                    <Input
                      type="text"
                      value={tax}
                      onChange={(e) => setTax(validateEnglishNumber(e.target.value))}
                      placeholder="0"
                      className="flex-1"
                      dir="ltr"
                      inputMode="decimal"
                    />
                  </div>
                    {tax && (
                      <p className="text-xs text-gray-500 mt-1">
                        مبلغ مالیات: {taxType === "percent" 
                          ? `${tax}% = ${calculateTotals().taxAmount.toLocaleString()} تومان`
                          : `${parseFloat(tax).toLocaleString()} تومان`}
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              {/* Totals */}
              <Card className="p-6 bg-gradient-to-br from-teal-50 to-teal-100">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">جمع کل آیتم‌ها:</span>
                    <span className="font-bold text-gray-800">{totals.totalAmount.toLocaleString()} تومان</span>
                  </div>
                  {discount && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">تخفیف:</span>
                      <span className="font-bold text-red-600">-{totals.discountAmount.toLocaleString()} تومان</span>
                    </div>
                  )}
                  {tax && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">مالیات:</span>
                      <span className="font-bold text-gray-800">+{totals.taxAmount.toLocaleString()} تومان</span>
                    </div>
                  )}
                  <div className="border-t border-teal-300 pt-3 flex justify-between items-center">
                    <span className="text-lg font-bold text-gray-800">مبلغ نهایی:</span>
                    <span className="text-2xl font-bold text-teal-700">{totals.finalAmount.toLocaleString()} تومان</span>
                  </div>
                </div>
              </Card>

              {/* Notes */}
              <Card className="p-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  یادداشت‌ها (اختیاری)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:border-teal-400 focus:ring-2 focus:ring-teal-100 outline-none transition-all duration-200 resize-none"
                  placeholder="یادداشت‌های اضافی..."
                />
              </Card>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => router.push("/accounting/invoices")}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
                >
                  انصراف
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-60"
                >
                  {isSubmitting ? "در حال ثبت..." : "ثبت فاکتور"}
                </Button>
              </div>
            </>
          )}
        </form>

        {/* Contact Selection Modal */}
        {isContactModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl max-h-[80vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <i className="fi fi-rr-users text-white text-lg"></i>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">انتخاب مخاطب</h2>
                    <p className="text-sm text-gray-600">مخاطب مورد نظر را انتخاب کنید</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setIsContactModalOpen(false);
                    setContactSearchTerm("");
                  }}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                >
                  <i className="fi fi-rr-cross text-gray-600 text-sm"></i>
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <i className="fi fi-rr-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      value={contactSearchTerm}
                      onChange={(e) => setContactSearchTerm(e.target.value)}
                      className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="جستجو در نام، تلفن یا ایمیل مخاطب..."
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {loadingContacts ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
                      در حال بارگذاری...
                    </div>
                  ) : filteredContacts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>مخاطبی یافت نشد</p>
                      <Link
                        href="/accounting/contacts"
                        className="text-blue-600 hover:text-blue-800 text-sm mt-2 inline-block"
                      >
                        افزودن مخاطب جدید
                      </Link>
                    </div>
                  ) : (
                    filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        onClick={() => {
                          setSelectedContact(contact);
                          setContactSearchTerm("");
                          setIsContactModalOpen(false);
                        }}
                        className="p-4 border border-gray-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <i className="fi fi-rr-user text-blue-600"></i>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-800">{contact.name}</h3>
                              {contact.phone && (
                                <p className="text-sm text-gray-600">{contact.phone}</p>
                              )}
                              {contact.email && (
                                <p className="text-xs text-gray-500">{contact.email}</p>
                              )}
                            </div>
                          </div>
                          <button className="px-3 py-1 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors">
                            انتخاب
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

