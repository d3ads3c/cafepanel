import { NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export async function PUT(request: Request) {
  const auth = await getAuth()
  if (!hasPermission(auth, 'manage_users')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }
  const pathname = new URL(request.url).pathname
  const match = pathname.match(/\/api\/users\/([^/]+)(?:\/)?$/)
  const id = parseInt(match?.[1] || '0', 10)
  const body = await request.json()
  const { displayName, email, isActive, permissions } = body || {}

  const connection = await pool.getConnection()
  try {
    await connection.execute(
      'UPDATE users SET display_name = ?, email = ?, is_active = ?, permissions = ? WHERE id = ?',
      [displayName || null, email || null, typeof isActive === 'boolean' ? (isActive ? 1 : 0) : 1, JSON.stringify(permissions || []), id]
    )
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Failed to update user' }, { status: 500 })
  } finally {
    connection.release()
  }
}

export async function DELETE(request: Request) {
  const auth = await getAuth()
  if (!hasPermission(auth, 'manage_users')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }
  const pathname = new URL(request.url).pathname
  const match = pathname.match(/\/api\/users\/([^/]+)(?:\/)?$/)
  const id = parseInt(match?.[1] || '0', 10)
  const connection = await pool.getConnection()
  try {
    await connection.execute('DELETE FROM users WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Failed to delete user' }, { status: 500 })
  } finally {
    connection.release()
  }
}


