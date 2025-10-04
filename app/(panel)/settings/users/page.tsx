"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

// Custom Checkbox Component
const CustomCheckbox = ({ 
  checked, 
  onChange, 
  label, 
  id 
}: { 
  checked: boolean; 
  onChange: () => void; 
  label: string; 
  id: string; 
}) => (
  <label htmlFor={id} className="flex items-center space-x-2 space-x-reverse cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className={`w-5 h-5 border-2 rounded transition-all duration-200 shadow-sm ${
        checked 
          ? 'bg-teal-500 border-teal-500 shadow-teal-200' 
          : 'border-gray-300 group-hover:border-teal-400 bg-white'
      }`}>
        {checked && (
          <svg 
            className="w-3 h-3 text-white absolute top-0.5 left-0.5" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path 
              fillRule="evenodd" 
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
              clipRule="evenodd" 
            />
          </svg>
        )}
      </div>
    </div>
    <span className={`text-sm transition-colors ${
      checked 
        ? 'text-teal-700 font-medium' 
        : 'text-gray-700 group-hover:text-gray-900'
    }`}>
      {label}
    </span>
  </label>
)

// Custom Radio Component
const CustomRadio = ({ 
  checked, 
  onChange, 
  label, 
  id, 
  name 
}: { 
  checked: boolean; 
  onChange: () => void; 
  label: string; 
  id: string; 
  name: string; 
}) => (
  <label htmlFor={id} className="flex items-center space-x-2 space-x-reverse cursor-pointer group p-2 rounded-lg hover:bg-gray-50 transition-colors">
    <div className="relative">
      <input
        type="radio"
        id={id}
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <div className={`w-5 h-5 border-2 rounded-full transition-all duration-200 shadow-sm ${
        checked 
          ? 'bg-teal-500 border-teal-500 shadow-teal-200' 
          : 'border-gray-300 group-hover:border-teal-400 bg-white'
      }`}>
        {checked && (
          <div className="w-2 h-2 bg-white rounded-full absolute top-1.5 left-1.5 shadow-sm"></div>
        )}
      </div>
    </div>
    <span className={`text-sm transition-colors ${
      checked 
        ? 'text-teal-700 font-medium' 
        : 'text-gray-700 group-hover:text-gray-900'
    }`}>
      {label}
    </span>
  </label>
)

type User = {
  id: number
  username: string
  display_name?: string
  email?: string
  is_active: 0 | 1
  permissions: any
}

const ALL_PERMISSIONS = [
  'view_dashboard',
  'manage_menu',
  'manage_orders',
  'manage_customers',
  'manage_categories',
  'manage_users',
  'manage_tables',
  'manage_buylist',
  'manage_accounting'
]

const PERMISSION_LABELS: Record<string, string> = {
  view_dashboard: 'مشاهده داشبورد',
  manage_menu: 'مدیریت منو',
  manage_orders: 'مدیریت سفارش‌ها',
  manage_customers: 'مدیریت مشتریان',
  manage_categories: 'مدیریت دسته‌بندی‌ها',
  manage_users: 'مدیریت کاربران',
  manage_tables: 'مدیریت میزها',
  manage_buylist: 'مدیریت لیست خرید',
  manage_accounting: 'مدیریت حسابداری',
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', displayName: '', email: '', permissions: [] as string[] })
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ displayName: '', email: '', isActive: true, permissions: [] as string[] })
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<number | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    const res = await fetch('/api/users')
    const data = await res.json()
    if (res.ok && data.success) setUsers(data.data)
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])
  useEffect(() => {
    // Check permission client-side and redirect if forbidden
    const check = async () => {
      const res = await fetch('/api/auth/me')
      const data = await res.json()
      const perms: string[] = data?.data?.permissions || []
      const userId = data?.data?.userId
      setCurrentUserId(userId)
      if (!Array.isArray(perms) || !perms.includes('manage_users')) {
        router.replace('/settings')
      }
    }
    check()
  }, [router])

  const togglePerm = (perm: string) => {
    setForm(prev => {
      const has = prev.permissions.includes(perm)
      const next = has ? prev.permissions.filter(p => p !== perm) : [...prev.permissions, perm]
      return { ...prev, permissions: next }
    })
  }

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.username,
        password: form.password,
        displayName: form.displayName,
        email: form.email,
        permissions: form.permissions
      })
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      setError(data.message || 'خطا در ایجاد کاربر')
    } else {
      setForm({ username: '', password: '', displayName: '', email: '', permissions: [] })
      fetchUsers()
    }
  }

  const openEditModal = (user: User) => {
    const userPermissions = Array.isArray(user.permissions) 
      ? user.permissions 
      : (() => { try { return JSON.parse(user.permissions || '[]') } catch { return [] } })()
    
    setEditingUser(user)
    setEditForm({
      displayName: user.display_name || '',
      email: user.email || '',
      isActive: user.is_active === 1,
      permissions: userPermissions
    })
    setEditError(null)
  }

  const closeEditModal = () => {
    setEditingUser(null)
    setEditForm({ displayName: '', email: '', isActive: true, permissions: [] })
    setEditError(null)
  }

  const toggleEditPerm = (perm: string) => {
    setEditForm(prev => {
      const has = prev.permissions.includes(perm)
      const next = has ? prev.permissions.filter(p => p !== perm) : [...prev.permissions, perm]
      return { ...prev, permissions: next }
    })
  }

  const updateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return
    
    setEditLoading(true)
    setEditError(null)
    
    const res = await fetch(`/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        displayName: editForm.displayName,
        email: editForm.email,
        isActive: editForm.isActive,
        permissions: editForm.permissions
      })
    })
    
    const data = await res.json()
    if (!res.ok || !data.success) {
      setEditError(data.message || 'خطا در بروزرسانی کاربر')
    } else {
      closeEditModal()
      fetchUsers()
    }
    setEditLoading(false)
  }

  return (
    <div className="xl:mt-0 mt-20 p-4">
      <div className="bg-white rounded-lg shadow-box p-4">
        <h2 className="text-lg font-bold mb-3">ایجاد کاربر</h2>
        {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
        <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input placeholder="نام کاربری" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} className="border rounded-lg p-2" />
          <input type="password" placeholder="رمز عبور" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="border rounded-lg p-2" />
          <input placeholder="نام نمایشی" value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} className="border rounded-lg p-2" />
          <input placeholder="ایمیل" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="border rounded-lg p-2" />
          <div className="md:col-span-2">
            <div className="text-sm text-gray-600 mb-3">دسترسی ها</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_PERMISSIONS.map(p => (
                <CustomCheckbox
                  key={p}
                  id={`create-${p}`}
                  checked={form.permissions.includes(p)}
                  onChange={() => togglePerm(p)}
                  label={PERMISSION_LABELS[p] || p}
                />
              ))}
            </div>
          </div>
          <div className="md:col-span-2">
            <button className="bg-teal-500 hover:bg-teal-600 text-white py-2 px-4 rounded-lg">ایجاد</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-box p-4 mt-4">
        <h2 className="text-lg font-bold mb-3">لیست کاربران</h2>
        {loading ? (
          <div>در حال بارگذاری...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-gray-600">
                  <th className="p-2">#</th>
                  <th className="p-2">نام</th>
                  <th className="p-2">ایمیل</th>
                  <th className="p-2">وضعیت</th>
                  <th className="p-2">دسترسی ها</th>
                  <th className="p-2">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.id}</td>
                    <td className="p-2">{u.display_name || u.username}</td>
                    <td className="p-2">{u.email || '-'}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${u.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.is_active ? 'فعال' : 'غیرفعال'}
                      </span>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(u.permissions) ? u.permissions : (() => { try { return JSON.parse(u.permissions || '[]') } catch { return [] } })()).map((p: string) => (
                          <span key={p} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{PERMISSION_LABELS[p] || p}</span>
                        ))}
                      </div>
                    </td>
                    <td className="p-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs transition-colors"
                      >
                        <i className="fi fi-rr-edit mr-1"></i>
                        ویرایش
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeEditModal()
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">ویرایش کاربر: {editingUser.username}</h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-500 hover:text-gray-700 text-xl"
                >
                  <i className="fi fi-rr-cross"></i>
                </button>
              </div>

              {editError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {editError}
                </div>
              )}

              {editingUser && currentUserId && editingUser.id === currentUserId && (
                <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                  <i className="fi fi-rr-exclamation-triangle mr-2"></i>
                  شما در حال ویرایش حساب کاربری خود هستید. تغییر دسترسی‌ها ممکن است بر دسترسی شما تأثیر بگذارد.
                </div>
              )}

              <form onSubmit={updateUser} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      نام نمایشی
                    </label>
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ایمیل
                    </label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    وضعیت کاربر
                  </label>
                  <div className="flex items-center gap-6">
                    <CustomRadio
                      id="edit-active"
                      name="isActive"
                      checked={editForm.isActive}
                      onChange={() => setEditForm(prev => ({ ...prev, isActive: true }))}
                      label="فعال"
                    />
                    <CustomRadio
                      id="edit-inactive"
                      name="isActive"
                      checked={!editForm.isActive}
                      onChange={() => setEditForm(prev => ({ ...prev, isActive: false }))}
                      label="غیرفعال"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    دسترسی‌ها
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {ALL_PERMISSIONS.map(perm => (
                      <CustomCheckbox
                        key={perm}
                        id={`edit-${perm}`}
                        checked={editForm.permissions.includes(perm)}
                        onChange={() => toggleEditPerm(perm)}
                        label={PERMISSION_LABELS[perm] || perm}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    انصراف
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {editLoading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


