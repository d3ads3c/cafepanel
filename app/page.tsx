"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        setError(data.message || 'خطا در ورود')
      } else {
        router.replace('/dashboard')
      }
    } catch (e) {
      setError('خطای شبکه')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={onSubmit} className="bg-white w-full max-w-sm p-6 rounded-lg shadow-box space-y-4">
        <h1 className="text-xl font-bold text-gray-800">ورود</h1>
        {error && <div className="text-sm text-red-500">{error}</div>}
        <div>
          <label className="block text-sm text-gray-600 mb-1">نام کاربری</label>
          <input value={username} onChange={e => setUsername(e.target.value)} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">رمز عبور</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border rounded-lg p-2 outline-none focus:ring-2 focus:ring-teal-400" />
        </div>
        <button disabled={loading} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg disabled:opacity-60">
          {loading ? '...' : 'ورود'}
        </button>
      </form>
    </div>
  )
}


