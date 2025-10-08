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
    const [rows] = await conn.query('SELECT p.*, b.name as bank_name FROM payments p LEFT JOIN bank_accounts b ON b.id = p.bank_account_id ORDER BY p.paid_at DESC')
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
  const { invoice_id, amount, method, bank_account_id, paid_at, notes } = body || {}
  if (!amount || !method) return NextResponse.json({ success: false, message: 'invalid' }, { status: 400 })
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    await conn.execute(
      'INSERT INTO payments (invoice_id, amount, method, bank_account_id, paid_at, notes) VALUES (?,?,?,?,?,?)',
      [invoice_id || null, amount, method, bank_account_id || null, paid_at || new Date(), notes || null]
    )
    // Optionally, mark invoice paid/partial based on sums
    if (invoice_id) {
      const [sumRows] = await conn.query('SELECT COALESCE(SUM(amount),0) as paid FROM payments WHERE invoice_id = ?', [invoice_id])
      const paid = (sumRows as any[])[0]?.paid || 0
      const [invRows] = await conn.query('SELECT final_amount FROM invoices WHERE id = ?', [invoice_id])
      const finalAmount = (invRows as any[])[0]?.final_amount || 0
      const status = paid >= finalAmount ? 'paid' : (paid > 0 ? 'partial' : 'pending')
      await conn.execute('UPDATE invoices SET payment_status = ? WHERE id = ?', [status, invoice_id])
    }
    await conn.commit()
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (e: any) {
    await conn.rollback()
    return NextResponse.json({ success: false, message: e?.message || 'error' }, { status: 500 })
  } finally {
    conn.release()
  }
}


