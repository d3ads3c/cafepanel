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
    const [rows] = await conn.query('SELECT * FROM bank_accounts ORDER BY id DESC')
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
  const { name, holder_name, iban, card_number, account_no } = body || {}
  if (!name) return NextResponse.json({ success: false, message: 'invalid' }, { status: 400 })
  const conn = await pool.getConnection()
  try {
    const [res] = await conn.execute('INSERT INTO bank_accounts (name, holder_name, iban, card_number, account_no) VALUES (?,?,?,?,?)', [name, holder_name || null, iban || null, card_number || null, account_no || null])
    return NextResponse.json({ success: true, data: { id: (res as any).insertId } }, { status: 201 })
  } finally {
    conn.release()
  }
}

export async function PUT(request: NextRequest) {
  const auth = await getAuth()
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }
  const body = await request.json()
  const { id, name, holder_name, iban, card_number, account_no } = body || {}
  if (!id || !name) return NextResponse.json({ success: false, message: 'invalid' }, { status: 400 })
  const conn = await pool.getConnection()
  try {
    await conn.execute('UPDATE bank_accounts SET name = ?, holder_name = ?, iban = ?, card_number = ?, account_no = ? WHERE id = ?', [name, holder_name || null, iban || null, card_number || null, account_no || null, id])
    return NextResponse.json({ success: true })
  } finally {
    conn.release()
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await getAuth()
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ success: false, message: 'invalid' }, { status: 400 })
  const conn = await pool.getConnection()
  try {
    await conn.execute('DELETE FROM bank_accounts WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } finally {
    conn.release()
  }
}


