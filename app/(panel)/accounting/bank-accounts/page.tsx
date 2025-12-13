"use client";
import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/lib/useToast';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SideDrawer from '@/components/ui/SideDrawer';

interface BankAccount {
  id: number;
  title: string;
  bank_name: string;
  holder: string;
  account_number: string;
  created_at: string;
  updated_at: string;
}

export default function BankAccountsPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    bank_name: '',
    holder: '',
    account_number: ['', '', '', '']
  });
  const accountNumberRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const fetchBankAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/accounting/bank-accounts');
      if (!response.ok) throw new Error('Failed to fetch bank accounts');
      const data = await response.json();
      setBankAccounts(data.data || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      showError('خطا در بارگذاری حساب‌های بانکی');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDrawer = (account?: BankAccount) => {
    if (account) {
      setEditingAccount(account);
      const accountNumber = account.account_number.match(/.{1,4}/g) || ['', '', '', ''];
      setFormData({
        title: account.title,
        bank_name: account.bank_name,
        holder: account.holder,
        account_number: accountNumber
      });
    } else {
      setEditingAccount(null);
      setFormData({
        title: '',
        bank_name: '',
        holder: '',
        account_number: ['', '', '', '']
      });
    }
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setEditingAccount(null);
    setFormData({
      title: '',
      bank_name: '',
      holder: '',
      account_number: ['', '', '', '']
    });
  };

  const handleAccountNumberChange = (index: number, value: string) => {
    // Only allow numbers and limit to 4 digits
    const numericValue = value.replace(/[^\d]/g, '').slice(0, 4);
    const newAccountNumber = [...formData.account_number];
    newAccountNumber[index] = numericValue;
    setFormData({ ...formData, account_number: newAccountNumber });

    // Auto-focus next input when 4 digits are entered
    if (numericValue.length === 4 && index < 3) {
      // Use setTimeout to ensure state is updated before focusing
      setTimeout(() => {
        accountNumberRefs[index + 1].current?.focus();
      }, 0);
    }
  };

  const handleAccountNumberKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to move to previous input
    if (e.key === 'Backspace' && formData.account_number[index] === '' && index > 0) {
      accountNumberRefs[index - 1].current?.focus();
    }
    
    // Handle paste event
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      navigator.clipboard.readText().then((text) => {
        const numbers = text.replace(/[^\d]/g, '').slice(0, 16);
        const parts = numbers.match(/.{1,4}/g) || [];
        const newAccountNumber = ['', '', '', ''];
        parts.forEach((part, i) => {
          if (i < 4) newAccountNumber[i] = part;
        });
        setFormData({ ...formData, account_number: newAccountNumber });
        // Focus the last filled input or next empty one
        const lastFilledIndex = parts.length - 1;
        if (lastFilledIndex < 3 && parts.length < 4) {
          setTimeout(() => {
            accountNumberRefs[lastFilledIndex + 1].current?.focus();
          }, 0);
        }
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.bank_name || !formData.holder) {
      showError('لطفاً تمام فیلدها را پر کنید');
      return;
    }

    const fullAccountNumber = formData.account_number.join('');
    if (fullAccountNumber.length !== 16) {
      showError('شماره حساب باید 16 رقم باشد');
      return;
    }

    try {
      const url = editingAccount 
        ? `/api/accounting/bank-accounts/${editingAccount.id}`
        : '/api/accounting/bank-accounts';
      
      const method = editingAccount ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          bank_name: formData.bank_name,
          holder: formData.holder,
          account_number: fullAccountNumber
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'خطا در ثبت حساب بانکی');
      }

      showSuccess(editingAccount ? 'حساب بانکی با موفقیت به‌روزرسانی شد' : 'حساب بانکی با موفقیت ثبت شد');
      handleCloseDrawer();
      fetchBankAccounts();
    } catch (error: any) {
      console.error('Error saving bank account:', error);
      showError(error.message || 'خطا در ثبت حساب بانکی');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('آیا مطمئن هستید که می‌خواهید این حساب بانکی را حذف کنید؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/accounting/bank-accounts/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete bank account');
      
      showSuccess('حساب بانکی با موفقیت حذف شد');
      fetchBankAccounts();
    } catch (error) {
      console.error('Error deleting bank account:', error);
      showError('خطا در حذف حساب بانکی');
    }
  };

  const formatAccountNumber = (accountNumber: string) => {
    return accountNumber.match(/.{1,4}/g)?.join('  -  ') || accountNumber;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">حساب‌های بانکی</h1>
        <Button
          onClick={() => handleOpenDrawer()}
          className="bg-teal-500 hover:bg-teal-600 text-white"
        >
          + افزودن حساب بانکی
        </Button>
      </div>

      {loading ? (
        <Card className="p-8 text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-teal-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">در حال بارگذاری...</p>
        </Card>
      ) : bankAccounts.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-6xl mb-4">💳</div>
          <p className="text-gray-600 text-lg mb-2">هیچ حساب بانکی ثبت نشده است</p>
          <p className="text-gray-400 text-sm mb-4">برای شروع، حساب بانکی جدید اضافه کنید</p>
          <Button
            onClick={() => handleOpenDrawer()}
            className="bg-teal-500 hover:bg-teal-600 text-white"
          >
            افزودن حساب بانکی
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bankAccounts.map((account) => (
            <div key={account.id} className="relative overflow-hidden hover:border-teal-400 transition-all">
              {/* Credit Card Style */}
              <div className="bg-gradient-to-br from-teal-600 to-teal-800 text-white p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm opacity-90">بانک</div>
                  <div className="text-2xl">💳</div>
                </div>
                <div className="text-lg font-bold mb-2">{account.bank_name}</div>
                <div className="text-sm opacity-90 mb-6">{account.title}</div>
                <div className="text-xl tracking-widest mb-2 text-center" dir='ltr'>
                  {formatAccountNumber(account.account_number)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <div className="opacity-75 text-xs mb-1">صاحب حساب</div>
                    <div className="font-semibold">{account.holder}</div>
                  </div>
                </div>
              </div>
              
              {/* Actions */}
              <div className="p-4 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenDrawer(account)}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  ویرایش
                </button>
                <button
                  onClick={() => handleDelete(account.id)}
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                >
                  حذف
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Side Drawer for Add/Edit */}
      <SideDrawer open={drawerOpen} onClose={handleCloseDrawer} width={500}>
        <div className="h-full flex flex-col bg-white">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">
              {editingAccount ? 'ویرایش حساب بانکی' : 'افزودن حساب بانکی'}
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
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                عنوان حساب
              </label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="مثال: حساب اصلی"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                نام بانک
              </label>
              <Input
                type="text"
                name="bank_name"
                value={formData.bank_name}
                onChange={handleInputChange}
                placeholder="مثال: بانک ملی"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                صاحب حساب
              </label>
              <Input
                type="text"
                name="holder"
                value={formData.holder}
                onChange={handleInputChange}
                placeholder="نام صاحب حساب"
                required
              />
            </div>

             <div>
               <label className="block text-sm font-semibold text-gray-800 mb-2">
                 شماره حساب (16 رقم)
               </label>
               <div className="flex gap-2" dir='ltr'>
                 {formData.account_number.map((part, index) => (
                   <Input
                     key={index}
                     ref={accountNumberRefs[index]}
                     id={`account-number-${index}`}
                     type="text"
                     inputMode="numeric"
                     maxLength={4}
                     value={part}
                     onChange={(e) => handleAccountNumberChange(index, e.target.value)}
                     onKeyDown={(e) => handleAccountNumberKeyDown(index, e)}
                     className="text-center font-mono text-lg tracking-wider"
                     placeholder="0000"
                     required
                   />
                 ))}
               </div>
               <p className="text-xs text-gray-500 mt-2">
                 شماره حساب را در 4 قسمت 4 رقمی وارد کنید
               </p>
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
                {editingAccount ? 'به‌روزرسانی' : 'ثبت'}
              </Button>
            </div>
          </form>
        </div>
      </SideDrawer>
    </div>
  );
}

