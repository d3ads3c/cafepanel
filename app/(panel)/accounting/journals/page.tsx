"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/lib/useToast";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import SideDrawer from "@/components/ui/SideDrawer";
import JalaliDatePicker from "@/components/ui/JalaliDatePicker";

interface JournalEntry {
  id?: number;
  account_code: string;
  account_name: string;
  description: string;
  debit_amount: string;
  credit_amount: string;
  entry_order: number;
}

interface Journal {
  id: number;
  journal_number: string;
  journal_date: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  entries: JournalEntry[];
}

interface BankAccount {
  id: number;
  title: string;
  bank_name: string;
  holder: string;
  account_number: string;
}

export default function JournalsPage() {
  const router = useRouter();
  const toast = useToast();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState(true);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBankAccounts, setLoadingBankAccounts] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);
  const [autoJournalNumber, setAutoJournalNumber] = useState(true);
  const [formData, setFormData] = useState({
    journal_number: "",
    journal_date: new Date().toISOString().split("T")[0],
    description: "",
    status: "draft" as "draft" | "posted" | "cancelled",
  });
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchJournals();
    fetchBankAccounts();
  }, []);

  const fetchJournals = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/accounting/journals");
      if (!response.ok) throw new Error("Failed to fetch journals");
      const data = await response.json();
      setJournals(data.data || []);
    } catch (error) {
      console.error("Error fetching journals:", error);
      toast.error("خطا در بارگذاری دفتر روزنامه");
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      setLoadingBankAccounts(true);
      const response = await fetch("/api/accounting/bank-accounts");
      if (!response.ok) throw new Error("Failed to fetch bank accounts");
      const data = await response.json();
      setBankAccounts(data.data || []);
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      toast.error("خطا در بارگذاری حساب‌های بانکی");
    } finally {
      setLoadingBankAccounts(false);
    }
  };

  const generateAutoJournalNumber = async () => {
    try {
      let sourceJournals = journals;
      if (!journals.length) {
        const response = await fetch("/api/accounting/journals");
        if (response.ok) {
          const data = await response.json();
          sourceJournals = data.data || [];
          setJournals(sourceJournals);
        }
      }
      const maxNumber = sourceJournals.reduce((max, jr) => {
        const num = parseInt(jr.journal_number, 10);
        return isNaN(num) ? max : Math.max(max, num);
      }, 0);
      setFormData((prev) => ({ ...prev, journal_number: String(maxNumber + 1 || 1) }));
    } catch (error) {
      console.error("Error generating journal number:", error);
      setFormData((prev) => ({ ...prev, journal_number: "1" }));
    }
  };

  const handleOpenDrawer = (journal?: Journal) => {
    if (journal) {
      setEditingJournal(journal);
      setAutoJournalNumber(false);
      setFormData({
        journal_number: journal.journal_number,
        journal_date: journal.journal_date.includes('T') 
          ? journal.journal_date.split('T')[0] 
          : journal.journal_date,
        description: journal.description || "",
        status: journal.status as "draft" | "posted" | "cancelled",
      });
      setEntries(journal.entries.map((e: any) => ({
        account_code: e.account_code,
        account_name: e.account_name,
        description: e.description || "",
        debit_amount: e.debit_amount ? e.debit_amount.toString() : "",
        credit_amount: e.credit_amount ? e.credit_amount.toString() : "",
        entry_order: e.entry_order || 0,
      })));
    } else {
      setEditingJournal(null);
      setAutoJournalNumber(true);
      setFormData({
        journal_number: "",
        journal_date: new Date().toISOString().split("T")[0],
        description: "",
        status: "draft",
      });
      setEntries([
        { account_code: "", account_name: "", description: "", debit_amount: "", credit_amount: "", entry_order: 1 },
        { account_code: "", account_name: "", description: "", debit_amount: "", credit_amount: "", entry_order: 2 },
      ]);
      generateAutoJournalNumber();
    }
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingJournal(null);
    setAutoJournalNumber(true);
    setFormData({
      journal_number: "",
      journal_date: new Date().toISOString().split("T")[0],
      description: "",
      status: "draft",
    });
    setEntries([]);
  };

  const addEntry = () => {
    const newEntries = [
      ...entries,
      { account_code: "", account_name: "", description: "", debit_amount: "", credit_amount: "", entry_order: entries.length + 1 },
    ].map((entry, idx) => ({ ...entry, entry_order: idx + 1 }));
    setEntries(newEntries);
  };

  const removeEntry = (index: number) => {
    if (entries.length <= 2) {
      toast.error("حداقل دو سطر لازم است");
      return;
    }
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries.map((e, i) => ({ ...e, entry_order: i + 1 })));
  };

  const updateEntry = (index: number, field: keyof JournalEntry, value: string) => {
    // use functional state update to keep sequential updates in the same tick
    setEntries((prev) => {
      const newEntries = [...prev];
      newEntries[index] = { ...newEntries[index], [field]: value };
      return newEntries;
    });
  };

  const copyEntryToNextRow = (index: number) => {
    const entryToCopy = entries[index];
    const duplicated = { ...entryToCopy, entry_order: index + 2 };
    const newEntries = [
      ...entries.slice(0, index + 1),
      duplicated,
      ...entries.slice(index + 1),
    ].map((entry, idx) => ({ ...entry, entry_order: idx + 1 }));
    setEntries(newEntries);
  };

  const handleAccountSelect = (index: number, value: string) => {
    if (!value) {
      updateEntry(index, 'account_name', "");
      updateEntry(index, 'account_code', "");
      return;
    }
    const selected = bankAccounts.find((acc) => String(acc.id) === value);
    if (selected) {
      updateEntry(index, 'account_name', selected.title);
      updateEntry(index, 'account_code', selected.account_number);
    }
  };

  const validateEnglishNumber = (value: string): string => {
    const toEnglishDigits = (val: string) =>
      val.replace(/[\u06F0-\u06F9\u0660-\u0669]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹۰١٢٣٤٥٦٧٨٩".indexOf(d)));

    const normalized = toEnglishDigits(value);
    return normalized.replace(/[^\d.]/g, '').replace(/\./g, (match, offset, string) => {
      return string.indexOf('.') === offset ? match : '';
    });
  };

  const calculateTotals = () => {
    const totalDebit = entries.reduce((sum, entry) => {
      const value = parseFloat(entry.debit_amount.replace(/,/g, '')) || 0;
      return sum + value;
    }, 0);
    const totalCredit = entries.reduce((sum, entry) => {
      const value = parseFloat(entry.credit_amount.replace(/,/g, '')) || 0;
      return sum + value;
    }, 0);
    return { totalDebit, totalCredit };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.journal_number || !formData.journal_date) {
      toast.error("لطفا فیلدهای الزامی را پر کنید");
      return;
    }

    if (entries.length < 2) {
      toast.error("حداقل دو سطر برای ثبت دفتر روزنامه لازم است");
      return;
    }

    const duplicate = journals.some(
      (j) =>
        j.journal_number === formData.journal_number &&
        (!editingJournal || j.id !== editingJournal.id)
    );
    if (duplicate) {
      toast.error("شماره دفتر روزنامه تکراری است");
      return;
    }

    // Validate all entries
    for (const entry of entries) {
      if (!entry.account_code || !entry.account_name) {
        toast.error("لطفا حساب را برای تمام سطرها انتخاب کنید");
        return;
      }
      const debit = parseFloat(entry.debit_amount.replace(/,/g, '')) || 0;
      const credit = parseFloat(entry.credit_amount.replace(/,/g, '')) || 0;
      if (debit > 0 && credit > 0) {
        toast.error("هر سطر باید فقط بدهکار یا فقط بستانکار باشد");
        return;
      }
      if (debit === 0 && credit === 0) {
        toast.error("هر سطر باید مقدار بدهکار یا بستانکار داشته باشد");
        return;
      }
    }

    const { totalDebit, totalCredit } = calculateTotals();

    try {
      const url = editingJournal
        ? `/api/accounting/journals/${editingJournal.id}`
        : '/api/accounting/journals';

      const method = editingJournal ? 'PUT' : 'POST';

      const formattedDate = formData.journal_date.includes('T') 
        ? formData.journal_date.split('T')[0] 
        : formData.journal_date;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          journal_number: formData.journal_number,
          journal_date: formattedDate,
          description: formData.description || null,
          status: formData.status,
          entries: entries.map((entry, index) => ({
            account_code: entry.account_code,
            account_name: entry.account_name,
            description: entry.description || null,
            debit_amount: parseFloat(entry.debit_amount.replace(/,/g, '')) || 0,
            credit_amount: parseFloat(entry.credit_amount.replace(/,/g, '')) || 0,
            entry_order: index + 1,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'خطا در ثبت دفتر روزنامه');
      }

      toast.success(editingJournal ? 'دفتر روزنامه با موفقیت به‌روزرسانی شد' : 'دفتر روزنامه با موفقیت ثبت شد');
      handleCloseDrawer();
      fetchJournals();
    } catch (error: any) {
      console.error('Error submitting journal:', error);
      toast.error(error.message || 'خطا در ثبت دفتر روزنامه');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("آیا مطمئن هستید؟")) return;

    try {
      const response = await fetch(`/api/accounting/journals/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete journal");

      setJournals(journals.filter((j) => j.id !== id));
      toast.success("دفتر روزنامه حذف شد");
    } catch (error) {
      console.error("Error deleting journal:", error);
      toast.error("خطا در حذف دفتر روزنامه");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  const filteredJournals = journals.filter((journal) => {
    const search = searchTerm.toLowerCase();
    return (
      journal.journal_number.toLowerCase().includes(search) ||
      (journal.description && journal.description.toLowerCase().includes(search))
    );
  });

  return (
    <div className="min-h-screen py-4 px-3 sm:px-0">
      <div className="mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
              دفتر روزنامه
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              ثبت و مدیریت دفتر روزنامه حسابداری
            </p>
          </div>
          <Button
            onClick={() => handleOpenDrawer()}
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
            ثبت جدید
          </Button>
        </div>

        {/* Search Bar */}
        <Card className="border border-gray-200">
          <Input
            type="text"
            placeholder="جستجو در شماره دفتر روزنامه یا توضیحات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            rightIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </Card>

        {/* Journals Table - Desktop */}
        <Card className="overflow-hidden border border-gray-200 hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">شماره</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">تاریخ</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">توضیحات</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">جمع بدهکار</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">جمع بستانکار</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">وضعیت</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-500 rounded-full animate-spin mb-2"></div>
                        در حال بارگذاری...
                      </div>
                    </td>
                  </tr>
                ) : filteredJournals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {searchTerm ? 'نتیجه‌ای یافت نشد' : 'دفتر روزنامه‌ای ثبت نشده است'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJournals.map((journal) => (
                    <tr key={journal.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">{journal.journal_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(journal.journal_date).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{journal.description || "-"}</td>
                      <td className="px-6 py-4 text-sm text-gray-700" dir="ltr">{formatPrice(journal.total_debit)}</td>
                      <td className="px-6 py-4 text-sm text-gray-700" dir="ltr">{formatPrice(journal.total_credit)}</td>
                      <td className="px-6 py-4 text-sm">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          journal.status === "posted" ? "bg-green-100 text-green-800 border border-green-200" :
                          journal.status === "cancelled" ? "bg-red-100 text-red-800 border border-red-200" :
                          "bg-gray-100 text-gray-800 border border-gray-200"
                        }`}>
                          {journal.status === "posted" ? "ثبت شده" : journal.status === "cancelled" ? "لغو شده" : "پیش‌نویس"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenDrawer(journal)}
                            className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                          >
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDelete(journal.id)}
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

        {/* Journals Cards - Mobile */}
        <div className="space-y-3 md:hidden">
          {loading ? (
            <Card className="border border-gray-200">
              <div className="flex flex-col items-center py-8 text-gray-500 text-sm">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-teal-500 rounded-full animate-spin mb-2"></div>
                در حال بارگذاری...
              </div>
            </Card>
          ) : filteredJournals.length === 0 ? (
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
                {searchTerm ? "نتیجه‌ای یافت نشد" : "دفتر روزنامه‌ای ثبت نشده است"}
              </div>
            </Card>
          ) : (
            filteredJournals.map((journal) => (
              <Card
                key={journal.id}
                className="border border-gray-200 hover:border-teal-300 hover:shadow-sm transition-all"
              >
                <div className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        دفتر #{journal.journal_number}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(journal.journal_date).toLocaleDateString(
                          "fa-IR"
                        )}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                        journal.status === "posted"
                          ? "bg-green-50 text-green-700 border border-green-100"
                          : journal.status === "cancelled"
                          ? "bg-red-50 text-red-700 border border-red-100"
                          : "bg-gray-50 text-gray-700 border border-gray-100"
                      }`}
                    >
                      {journal.status === "posted"
                        ? "ثبت شده"
                        : journal.status === "cancelled"
                        ? "لغو شده"
                        : "پیش‌نویس"}
                    </span>
                  </div>

                  {journal.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {journal.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm">
                    <div className="text-xs text-gray-600">
                      <p>جمع بدهکار</p>
                      <p className="font-semibold text-gray-900 mt-0.5" dir="ltr">
                        {formatPrice(journal.total_debit)}
                      </p>
                    </div>
                    <div className="text-xs text-gray-600 text-right">
                      <p>جمع بستانکار</p>
                      <p className="font-semibold text-teal-700 mt-0.5" dir="ltr">
                        {formatPrice(journal.total_credit)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-1">
                    <button
                      onClick={() => handleOpenDrawer(journal)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      ویرایش
                    </button>
                    <button
                      onClick={() => handleDelete(journal.id)}
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

      {/* Side Drawer for Add/Edit */}
      <SideDrawer open={drawerOpen} onClose={handleCloseDrawer} width="100%">
        <div className="h-full flex flex-col bg-white">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {editingJournal ? 'ویرایش دفتر روزنامه' : 'ثبت دفتر روزنامه جدید'}
            </h2>
            <button
              onClick={handleCloseDrawer}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">شماره دفتر روزنامه *</label>
                <div className="flex items-center gap-3 mb-2">
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={autoJournalNumber}
                      onChange={(e) => {
                        setAutoJournalNumber(e.target.checked);
                        if (e.target.checked) {
                          generateAutoJournalNumber();
                        }
                      }}
                      className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                    />
                    خودکار
                  </label>
                  {autoJournalNumber && (
                    <button
                      type="button"
                      onClick={generateAutoJournalNumber}
                      className="text-xs text-teal-600 hover:text-teal-700 underline underline-offset-2"
                    >
                      تولید مجدد شماره
                    </button>
                  )}
                </div>
                <Input
                  type="text"
                  value={formData.journal_number}
                  onChange={(e) => setFormData({ ...formData, journal_number: e.target.value })}
                  disabled={autoJournalNumber}
                  placeholder="مثال: JRN-001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">تاریخ *</label>
                <JalaliDatePicker
                  value={formData.journal_date}
                  onChange={(date) => setFormData({ ...formData, journal_date: date })}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">توضیحات</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm resize-none"
                placeholder="توضیحات اختیاری..."
              />
            </div>

            {/* Entries Table */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">سطرهای دفتر روزنامه</h3>
                <Button type="button" onClick={addEntry} variant="outline" className="text-sm">
                  + افزودن سطر
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">ردیف</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">حساب</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">توضیحات</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">بدهکار</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">بستانکار</th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-gray-700">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry, index) => {
                      const matchedAccount = bankAccounts.find((acc) => acc.account_number === entry.account_code);
                      const selectValue = matchedAccount?.id?.toString() || "";
                      const placeholder = loadingBankAccounts
                        ? "در حال بارگذاری..."
                        : entry.account_name
                          ? `حساب فعلی: ${entry.account_name}`
                          : "انتخاب حساب بانکی";
                      return (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="px-4 py-2 text-sm text-gray-700">{index + 1}</td>
                          <td className="px-4 py-2">
                            <select
                              value={selectValue}
                              onChange={(e) => handleAccountSelect(index, e.target.value)}
                              className="w-full rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm min-w-[180px]"
                            >
                              <option value="">{placeholder}</option>
                              {bankAccounts.map((acc) => (
                                <option key={acc.id} value={acc.id.toString()}>
                                  {acc.title} - {acc.bank_name} ({acc.account_number})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="text"
                              value={entry.description}
                              onChange={(e) => updateEntry(index, 'description', e.target.value)}
                              placeholder="توضیحات"
                              className="min-w-[150px]"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="text"
                              value={entry.debit_amount}
                              onChange={(e) => {
                                const value = validateEnglishNumber(e.target.value.replace(/,/g, ''));
                                if (value === "" || value === "0") {
                                  updateEntry(index, 'debit_amount', "");
                                  updateEntry(index, 'credit_amount', entry.credit_amount);
                                } else {
                                  const numValue = parseFloat(value);
                                  if (!isNaN(numValue)) {
                                    const formatted = numValue % 1 === 0 
                                      ? numValue.toLocaleString("en-US", { maximumFractionDigits: 0 })
                                      : numValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                                    updateEntry(index, 'debit_amount', formatted);
                                    updateEntry(index, 'credit_amount', "");
                                  } else {
                                    updateEntry(index, 'debit_amount', value);
                                  }
                                }
                              }}
                              placeholder="0"
                              className="w-32"
                              dir="ltr"
                              inputMode="decimal"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <Input
                              type="text"
                              value={entry.credit_amount}
                              onChange={(e) => {
                                const value = validateEnglishNumber(e.target.value.replace(/,/g, ''));
                                if (value === "" || value === "0") {
                                  updateEntry(index, 'credit_amount', "");
                                  updateEntry(index, 'debit_amount', entry.debit_amount);
                                } else {
                                  const numValue = parseFloat(value);
                                  if (!isNaN(numValue)) {
                                    const formatted = numValue % 1 === 0 
                                      ? numValue.toLocaleString("en-US", { maximumFractionDigits: 0 })
                                      : numValue.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                                    updateEntry(index, 'credit_amount', formatted);
                                    updateEntry(index, 'debit_amount', "");
                                  } else {
                                    updateEntry(index, 'credit_amount', value);
                                  }
                                }
                              }}
                              placeholder="0"
                              className="w-32"
                              dir="ltr"
                              inputMode="decimal"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => copyEntryToNextRow(index)}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                title="کپی در سطر بعدی"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8m-8 4h5m-7 8h10a2 2 0 002-2V7l-5-5H6a2 2 0 00-2 2v13a2 2 0 002 2z" />
                                </svg>
                              </button>
                              <button
                                type="button"
                                onClick={() => removeEntry(index)}
                                className={`transition-colors ${entries.length <= 2 ? "text-gray-400" : "text-red-600 hover:text-red-800"}`}
                                disabled={entries.length <= 2}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50 font-semibold">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right">جمع کل:</td>
                      <td className="px-4 py-3" dir="ltr">{formatPrice(calculateTotals().totalDebit)}</td>
                      <td className="px-4 py-3" dir="ltr">{formatPrice(calculateTotals().totalCredit)}</td>
                      <td className="px-4 py-3 text-xs text-gray-700" dir="ltr">
                        اختلاف: {formatPrice(calculateTotals().totalDebit - calculateTotals().totalCredit)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">وضعیت</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as "draft" | "posted" | "cancelled" })}
                className="w-full rounded-xl border border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200 px-3 py-2 text-sm"
              >
                <option value="draft">پیش‌نویس</option>
                <option value="posted">ثبت شده</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                onClick={handleCloseDrawer}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                انصراف
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
              >
                {editingJournal ? 'ذخیره تغییرات' : 'ثبت دفتر روزنامه'}
              </Button>
            </div>
          </form>
        </div>
      </SideDrawer>
    </div>
  );
}

