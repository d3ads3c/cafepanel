import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export async function GET() {
  const auth = await getAuth()
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query('SELECT * FROM accounts ORDER BY code')
    return NextResponse.json({ success: true, data: rows })
  } finally {
    conn.release()
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuth()
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }
  const body = await request.json()
  const { code, name, type, parent_id } = body || {}
  if (!code || !name || !type) return NextResponse.json({ success: false, message: 'invalid' }, { status: 400 })
  const conn = await pool.getConnection()
  try {
    await conn.execute('INSERT INTO accounts (code, name, type, parent_id) VALUES (?,?,?,?)', [code, name, type, parent_id || null])
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'error' }, { status: 500 })
  } finally {
    conn.release()
  }
}


