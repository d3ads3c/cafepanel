import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { signPayload, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { username, password } = body || {}
  if (!username || !password) {
    return NextResponse.json({ success: false, message: 'username and password are required' }, { status: 400 })
  }

  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.execute(
      'SELECT id, username, password_hash, permissions, is_active FROM users WHERE username = ? LIMIT 1',
      [username]
    )
    const list = rows as any[]
    if (!list.length) {
      return NextResponse.json({ success: false, message: 'invalid credentials' }, { status: 401 })
    }
    const user = list[0]
    if (!user.is_active) {
      return NextResponse.json({ success: false, message: 'user is inactive' }, { status: 403 })
    }

    // Insecure plain-text match per request. Replace with hashing in production.
    if (user.password_hash !== password) {
      return NextResponse.json({ success: false, message: 'invalid credentials' }, { status: 401 })
    }

    const permissions: string[] = Array.isArray(user.permissions)
      ? user.permissions
      : (() => { try { return JSON.parse(user.permissions || '[]') } catch { return [] } })()

    const token = signPayload({ userId: user.id, username: user.username, permissions })
    const response = NextResponse.json({ success: true })
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })
    return response
  } catch (e) {
    return NextResponse.json({ success: false, message: 'login failed' }, { status: 500 })
  } finally {
    connection.release()
  }
}


