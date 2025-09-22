"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

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
  'manage_users'
]

const PERMISSION_LABELS: Record<string, string> = {
  view_dashboard: 'مشاهده داشبورد',
  manage_menu: 'مدیریت منو',
  manage_orders: 'مدیریت سفارش‌ها',
  manage_customers: 'مدیریت مشتریان',
  manage_categories: 'مدیریت دسته‌بندی‌ها',
  manage_users: 'مدیریت کاربران',
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ username: '', password: '', displayName: '', email: '', permissions: [] as string[] })
  const [error, setError] = useState<string | null>(null)

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
            <div className="text-sm text-gray-600 mb-2">دسترسی ها</div>
            <div className="flex flex-wrap gap-2">
              {ALL_PERMISSIONS.map(p => (
                <label key={p} className="relative inline-block cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="absolute left-0 top-0 h-0 w-0 -m-2 opacity-0 pointer-events-none appearance-none peer"
                    checked={form.permissions.includes(p)}
                    onChange={() => togglePerm(p)}
                  />
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-gray-700 transition-colors peer-checked:bg-teal-50 peer-checked:text-teal-600 peer-checked:border-teal-400 hover:border-gray-300">

                    {PERMISSION_LABELS[p] || p}
                  </span>
                </label>
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
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2">{u.id}</td>
                    <td className="p-2">{u.display_name || u.username}</td>
                    <td className="p-2">{u.email || '-'}</td>
                    <td className="p-2">{u.is_active ? 'فعال' : 'غیرفعال'}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {(Array.isArray(u.permissions) ? u.permissions : (() => { try { return JSON.parse(u.permissions || '[]') } catch { return [] } })()).map((p: string) => (
                          <span key={p} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{PERMISSION_LABELS[p] || p}</span>
                        ))}
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
  )
}


