"use client";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";

interface Contact {
  id: number;
  name: string;
  type: 'customer' | 'supplier';
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  total_invoices: number;
  total_amount: number;
  created_at: string;
  last_invoice_date?: string;
  unpaid_count?: number;
  unpaid_total?: number;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'supplier'>('all');
  const itemsPerPage = 20;
  const [form, setForm] = useState({
    name: "",
    type: 'customer' as 'customer' | 'supplier',
    phone: "",
    email: "",
    address: "",
    notes: "",
  });

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual API call
      // const res = await fetch("/api/accounting/contacts");
      // const data = await res.json();
      
      // Mock data for now
      const mockContacts: Contact[] = [
        {
          id: 1,
          name: "شرکت نمونه",
          type: 'customer',
          phone: "09123456789",
          email: "info@example.com",
          address: "تهران، خیابان ولیعصر",
          notes: "مشتری VIP",
          total_invoices: 5,
          total_amount: 1500000,
          created_at: "2024-01-15",
          last_invoice_date: "2024-01-20",
          unpaid_count: 1,
          unpaid_total: 300000
        },
        {
          id: 2,
          name: "تأمین‌کننده مواد اولیه",
          type: 'supplier',
          phone: "09187654321",
          email: "supplier@example.com",
          address: "اصفهان، خیابان چهارباغ",
          notes: "تأمین‌کننده اصلی",
          total_invoices: 3,
          total_amount: 800000,
          created_at: "2024-01-10",
          last_invoice_date: "2024-01-18",
          unpaid_count: 0,
          unpaid_total: 0
        }
      ];
      
      setContacts(mockContacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
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
      // This would be replaced with actual API call
      // const url = editingContact ? `/api/accounting/contacts/${editingContact.id}` : "/api/accounting/contacts";
      // const method = editingContact ? "PUT" : "POST";
      
      // Mock success
      toast.success(editingContact ? "مخاطب با موفقیت ویرایش شد" : "مخاطب جدید با موفقیت اضافه شد");
      setDialogOpen(false);
      setEditingContact(null);
      setForm({ name: "", type: 'customer', phone: "", email: "", address: "", notes: "" });
      fetchContacts();
    } catch (error) {
      console.error("Error saving contact:", error);
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setForm({
      name: contact.name,
      type: contact.type,
      phone: contact.phone,
      email: contact.email || "",
      address: contact.address || "",
      notes: contact.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این مخاطب را حذف کنید؟")) {
      return;
    }

    try {
      // This would be replaced with actual API call
      // const res = await fetch(`/api/accounting/contacts/${id}`, { method: "DELETE" });
      
      // Mock success
      toast.success("مخاطب با موفقیت حذف شد");
      fetchContacts();
    } catch (error) {
      console.error("Error deleting contact:", error);
      toast.error("خطا در ارتباط با سرور");
    }
  };

  const resetForm = () => {
    setForm({ name: "", type: 'customer', phone: "", email: "", address: "", notes: "" });
    setEditingContact(null);
    setDialogOpen(false);
  };

  const filteredContacts = contacts.filter(
    (contact) => {
      const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm) ||
        (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = typeFilter === 'all' || contact.type === typeFilter;
      
      return matchesSearch && matchesType;
    }
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  // Reset to first page when search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    const rounded = Math.round(Number.isNaN(numPrice) ? 0 : numPrice);
    return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fa-IR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl xl:text-3xl font-bold text-gray-800">مدیریت مخاطبین</h1>
          <p className="text-gray-600 mt-1">مدیریت مشتریان و تأمین‌کنندگان حسابداری</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDialogOpen(true)}
            className="bg-teal-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-teal-600 transition-colors flex items-center gap-2"
          >
            <i className="fi fi-rr-plus"></i>
            مخاطب جدید
          </button>
        </div>
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
            <p className="text-2xl font-bold text-teal-600">{contacts.length}</p>
            <p className="text-sm text-gray-600">کل مخاطبین</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-box p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">نوع مخاطب</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'customer' | 'supplier')}
              className="border border-gray-300 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">همه</option>
              <option value="customer">مشتری</option>
              <option value="supplier">تأمین‌کننده</option>
            </select>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-2xl shadow-box overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">در حال بارگذاری...</div>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="text-center py-12">
            <i className="fi fi-rr-users text-6xl text-gray-300 mb-4"></i>
            <p className="text-gray-500 text-lg mb-2">
              {searchTerm || typeFilter !== 'all' ? "نتیجه‌ای یافت نشد" : "هیچ مخاطبی ثبت نشده است"}
            </p>
            <p className="text-gray-400 text-sm">
              {searchTerm || typeFilter !== 'all' ? "لطفاً عبارت جستجو را تغییر دهید" : "برای شروع، مخاطب جدید اضافه کنید"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">مخاطب</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">نوع</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">تماس</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">فاکتورها</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">مجموع مبلغ</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">بدهکار</th>
                  <th className="text-right py-4 px-6 text-sm font-medium text-gray-700">آخرین فاکتور</th>
                  <th className="text-center py-4 px-6 text-sm font-medium text-gray-700">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedContacts.map((contact) => (
                  <tr key={contact.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          contact.type === 'customer' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <i className={`fi fi-rr-user text-sm ${
                            contact.type === 'customer' ? 'text-green-600' : 'text-blue-600'
                          }`}></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{contact.name}</p>
                          {contact.email && (
                            <p className="text-sm text-gray-500">{contact.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        contact.type === 'customer' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {contact.type === 'customer' ? 'مشتری' : 'تأمین‌کننده'}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-gray-800">{contact.phone}</p>
                      {contact.address && (
                        <p className="text-sm text-gray-500 mt-1">{contact.address}</p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-right">
                        <p className="font-medium text-gray-800">{contact.total_invoices}</p>
                        <p className="text-xs text-gray-500">فاکتور</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-right">
                        <p className="font-medium text-gray-800">{formatPrice(contact.total_amount)}</p>
                        <p className="text-xs text-gray-500">تومان</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-right">
                        <p className={`font-medium ${contact.unpaid_total && contact.unpaid_total > 0 ? 'text-red-600' : 'text-gray-800'}`}>
                          {formatPrice(contact.unpaid_total || 0)}
                        </p>
                        <p className="text-xs text-gray-500">{(contact.unpaid_count || 0)} فاکتور</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <p className="text-sm text-gray-600">
                        {contact.last_invoice_date ? formatDate(contact.last_invoice_date) : "ندارد"}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(contact)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="ویرایش"
                        >
                          <i className="fi fi-rr-edit text-sm"></i>
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
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
      {filteredContacts.length > 0 && totalPages > 1 && (
        <div className="bg-white rounded-2xl p-4 shadow-box">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              نمایش {startIndex + 1} تا {Math.min(endIndex, filteredContacts.length)} از {filteredContacts.length} مخاطب
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

      {/* Contact Form Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">
                  {editingContact ? "ویرایش مخاطب" : "مخاطب جدید"}
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
                      نام و نام خانوادگی / نام شرکت *
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="نام کامل مخاطب"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نوع مخاطب *
                    </label>
                    <select
                      required
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value as 'customer' | 'supplier' })}
                    >
                      <option value="customer">مشتری</option>
                      <option value="supplier">تأمین‌کننده</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ایمیل
                    </label>
                    <input
                      type="email"
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="contact@example.com"
                    />
                  </div>
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
                    placeholder="آدرس کامل مخاطب"
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
                    {editingContact ? "ویرایش" : "افزودن"} مخاطب
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
