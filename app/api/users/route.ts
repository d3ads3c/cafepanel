import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

// GET /api/users - list users (without password)
export async function GET() {
  const auth = await getAuth()
  if (!hasPermission(auth, 'manage_users')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }
  const connection = await pool.getConnection()
  try {
    const [rows] = await connection.query(
      'SELECT id, username, display_name, email, is_active, permissions, created_at, updated_at FROM users ORDER BY id DESC'
    )
    return NextResponse.json({ success: true, data: rows })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Failed to fetch users' }, { status: 500 })
  } finally {
    connection.release()
  }
}

// POST /api/users - create user
export async function POST(request: NextRequest) {
  const auth = await getAuth()
  if (!hasPermission(auth, 'manage_users')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }
  const body = await request.json()
  const { username, password, displayName, email, isActive = 1, permissions = [] } = body || {}
  if (!username || !password) {
    return NextResponse.json({ success: false, message: 'username and password are required' }, { status: 400 })
  }

  // WARNING: Storing plain password is insecure; per request, we will store as-is.
  // Consider hashing in production.

  const connection = await pool.getConnection()
  try {
    const [result] = await connection.execute(
      'INSERT INTO users (username, password_hash, display_name, email, is_active, permissions) VALUES (?, ?, ?, ?, ?, ?)',
      [username, password, displayName || null, email || null, isActive ? 1 : 0, JSON.stringify(permissions || [])]
    )
    const insertId = (result as any).insertId
    return NextResponse.json({ success: true, data: { id: insertId } }, { status: 201 })
  } catch (e: any) {
    if (e && e.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ success: false, message: 'username already exists' }, { status: 409 })
    }
    return NextResponse.json({ success: false, message: 'Failed to create user' }, { status: 500 })
  } finally {
    connection.release()
  }
}


