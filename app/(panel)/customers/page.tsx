"use client";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
  last_order_date?: string;
}

export default function CustomersPage() {
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
  });

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
        toast.error("خطا در دریافت اطلاعات مشتریان");
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("خطا در ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("نام و شماره تلفن الزامی است");
      return;
    }

    try {
      const url = editingCustomer ? `/api/customers/${editingCustomer.id}` : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const result = await res.json();
      
      if (result.success) {
        toast.success(editingCustomer ? "مشتری با موفقیت ویرایش شد" : "مشتری جدید با موفقیت اضافه شد");
        setDialogOpen(false);
        setEditingCustomer(null);
        setForm({ name: "", phone: "", email: "", address: "", notes: "" });
        fetchCustomers();
      } else {
        toast.error(result.message || "خطا در ذخیره اطلاعات");
      }
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error("خطا در ارتباط با سرور");
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
        toast.success("مشتری با موفقیت حذف شد");
        fetchCustomers();
      } else {
        toast.error(result.message || "خطا در حذف مشتری");
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const resetForm = () => {
    setForm({ name: "", phone: "", email: "", address: "", notes: "" });
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

  const formatPrice = (price: number) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="xl:mt-0 mt-20">
      <div className="xl:px-0 px-7 py-5 space-y-6">
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <h1 className="text-2xl xl:text-3xl font-bold text-gray-800">مدیریت مشتریان</h1>
            <p className="text-gray-600 mt-1">مدیریت اطلاعات مشتریان و تاریخچه سفارشات</p>
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="bg-teal-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-600 transition-colors flex items-center gap-2"
          >
            <i className="fi fi-rr-plus"></i>
            مشتری جدید
          </button>
        </div>

        {/* Search and Stats */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3">
            <div className="relative">
              <i className="fi fi-rr-search absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="جستجو در نام، شماره تلفن یا ایمیل..."
                className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-box">
            <div className="text-center">
              <p className="text-2xl font-bold text-teal-600">{customers.length}</p>
              <p className="text-sm text-gray-600">کل مشتریان</p>
            </div>
          </div>
        </div>

        {/* Customers List */}
        <div className="bg-white rounded-2xl shadow-box overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">در حال بارگذاری...</div>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-12">
              <i className="fi fi-rr-users text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-500 text-lg mb-2">
                {searchTerm ? "نتیجه‌ای یافت نشد" : "هیچ مشتری ثبت نشده است"}
              </p>
              <p className="text-gray-400 text-sm">
                {searchTerm ? "لطفاً عبارت جستجو را تغییر دهید" : "برای شروع، مشتری جدید اضافه کنید"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">مشتری</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">تماس</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">سفارشات</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">مجموع خرید</th>
                    <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">آخرین سفارش</th>
                    <th className="text-center py-4 px-6 text-sm font-medium text-gray-700">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginatedCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                            <i className="fi fi-rr-user text-teal-600"></i>
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{customer.name}</p>
                            {customer.email && (
                              <p className="text-sm text-gray-500">{customer.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-gray-800">{customer.phone}</p>
                        {customer.address && (
                          <p className="text-sm text-gray-500 mt-1">{customer.address}</p>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-center">
                          <p className="font-medium text-gray-800">{customer.total_orders}</p>
                          <p className="text-xs text-gray-500">سفارش</p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-left">
                          <p className="font-medium text-gray-800">{formatPrice(customer.total_spent)}</p>
                          <p className="text-xs text-gray-500">تومان</p>
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
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="ویرایش"
                          >
                            <i className="fi fi-rr-edit text-sm"></i>
                          </button>
                          <button
                            onClick={() => handleDelete(customer.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <i className="fi fi-rr-trash text-sm"></i>
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

        {/* Pagination */}
        {filteredCustomers.length > 0 && totalPages > 1 && (
          <div className="bg-white rounded-2xl p-4 shadow-box">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                نمایش {startIndex + 1} تا {Math.min(endIndex, filteredCustomers.length)} از {filteredCustomers.length} مشتری
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                            ? 'bg-teal-500 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
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
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingCustomer ? "ویرایش مشتری" : "مشتری جدید"}
                </h3>
                <button
                  onClick={resetForm}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fi fi-rr-cross text-xl"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نام و نام خانوادگی *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="نام کامل مشتری"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      شماره تلفن *
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="09123456789"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ایمیل
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    آدرس
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    placeholder="آدرس کامل مشتری"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    یادداشت
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="یادداشت‌های اضافی..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 text-gray-600 py-3 rounded-xl border border-gray-300 hover:bg-gray-50 transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-teal-500 text-white py-3 rounded-xl font-medium hover:bg-teal-600 transition-colors"
                  >
                    {editingCustomer ? "ویرایش" : "افزودن"} مشتری
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-center" />
    </div>
  );
}
