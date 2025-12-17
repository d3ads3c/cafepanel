"use client";
import { useState, useEffect } from 'react';
import { useToast } from "@/lib/useToast";
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import SideDrawer from '@/components/ui/SideDrawer';

interface Contact {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contact_type: 'supplier' | 'customer' | 'other';
  tax_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function ContactsPage() {
  const toast = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    contact_type: 'other' as 'supplier' | 'customer' | 'other',
    tax_id: '',
    notes: '',
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounting/contacts');
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setContacts(data.data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('خطا در بارگذاری مخاطبین');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (contact?: Contact) => {
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name || '',
        phone: contact.phone || '',
        email: contact.email || '',
        address: contact.address || '',
        contact_type: contact.contact_type || 'other',
        tax_id: contact.tax_id || '',
        notes: contact.notes || '',
      });
    } else {
      setEditingContact(null);
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        contact_type: 'other',
        tax_id: '',
        notes: '',
      });
    }
    setDrawerOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast.error('نام مخاطب الزامی است');
      return;
    }

    try {
      const url = editingContact 
        ? `/api/accounting/contacts/${editingContact.id}`
        : '/api/accounting/contacts';
      
      const method = editingContact ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'خطا در ثبت مخاطب');
      }

      toast.success(editingContact ? 'مخاطب با موفقیت به‌روزرسانی شد' : 'مخاطب با موفقیت ثبت شد');
      setDrawerOpen(false);
      fetchContacts();
    } catch (error: any) {
      console.error('Error submitting contact:', error);
      toast.error(error.message || 'خطا در ثبت مخاطب');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا مطمئن هستید؟')) return;
    
    try {
      const response = await fetch(`/api/accounting/contacts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete contact');
      
      setContacts(contacts.filter(contact => contact.id !== id));
      toast.success('مخاطب حذف شد');
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('خطا در حذف مخاطب');
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const search = searchTerm.toLowerCase();
    return (
      contact.name.toLowerCase().includes(search) ||
      contact.phone?.toLowerCase().includes(search) ||
      contact.email?.toLowerCase().includes(search)
    );
  });

  const getContactTypeLabel = (type: string) => {
    switch (type) {
      case 'supplier': return 'تامین کننده';
      case 'customer': return 'مشتری';
      default: return 'سایر';
    }
  };

  const getContactTypeColor = (type: string) => {
    switch (type) {
      case 'supplier': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'customer': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen py-8 px-3 sm:px-6">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
              مدیریت مخاطبین
            </h1>
            <p className="text-gray-500 text-sm mt-1">ثبت و مدیریت مخاطبین فاکتورها</p>
          </div>
          <Button
            onClick={() => handleOpenDrawer()}
            className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white shadow-md"
          >
            <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            مخاطب جدید
          </Button>
        </div>

        {/* Search */}
        <Card className="border border-gray-200">
          <Input
            type="text"
            placeholder="جستجو در نام، شماره تلفن یا ایمیل..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            rightIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </Card>

        {/* Contacts Grid */}
        {loading ? (
          <Card className="border border-gray-200">
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-500 rounded-full animate-spin mb-2"></div>
                در حال بارگذاری...
              </div>
            </div>
          </Card>
        ) : filteredContacts.length === 0 ? (
          <Card className="border border-gray-200">
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center">
                <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-3-3h-4a3 3 0 00-3 3v2h5zM13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <p className="text-gray-500 font-medium">
                  {searchTerm ? 'نتیجه‌ای یافت نشد' : 'هیچ مخاطبی ثبت نشده است'}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((contact) => (
              <Card key={contact.id} className="border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">{contact.name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getContactTypeColor(contact.contact_type)}`}>
                        {getContactTypeLabel(contact.contact_type)}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleOpenDrawer(contact)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(contact.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    {contact.phone && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {contact.phone}
                      </div>
                    )}
                    {contact.email && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        {contact.email}
                      </div>
                    )}
                    {contact.address && (
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="line-clamp-2">{contact.address}</span>
                      </div>
                    )}
                    {contact.tax_id && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        کد اقتصادی: {contact.tax_id}
                      </div>
                    )}
                  </div>

                  {contact.notes && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 line-clamp-2">{contact.notes}</p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Side Drawer for Add/Edit */}
      <SideDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width="100%">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">
              {editingContact ? 'ویرایش مخاطب' : 'مخاطب جدید'}
            </h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نام *</label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="نام مخاطب"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع مخاطب</label>
              <select
                name="contact_type"
                value={formData.contact_type}
                onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-300 focus:border-teal-500 focus:outline-teal-500 px-3 py-2 text-sm"
              >
                <option value="supplier">تامین کننده</option>
                <option value="customer">مشتری</option>
                <option value="other">سایر</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">شماره تلفن</label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="09123456789"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ایمیل</label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="example@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">آدرس</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-xl border border-gray-300 focus:border-teal-500 focus:outline-teal-500 px-3 py-2 text-sm resize-none"
                placeholder="آدرس مخاطب"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">کد اقتصادی</label>
              <Input
                type="text"
                name="tax_id"
                value={formData.tax_id}
                onChange={handleInputChange}
                placeholder="کد اقتصادی"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">توضیحات</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full rounded-xl border border-gray-300 focus:border-teal-500 focus:outline-teal-500 px-3 py-2 text-sm resize-none"
                placeholder="توضیحات اختیاری..."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDrawerOpen(false)}
                className="flex-1"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
              >
                {editingContact ? 'ذخیره تغییرات' : 'ثبت مخاطب'}
              </Button>
            </div>
          </form>
        </div>
      </SideDrawer>
    </div>
  );
}

