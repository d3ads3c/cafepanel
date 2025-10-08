import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  const auth = await getAuth()
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }
  const { searchParams } = new URL(request.url)
  const accountId = searchParams.get('account_id')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  if (!accountId) return NextResponse.json({ success: false, message: 'account_id required' }, { status: 400 })
  const where: string[] = ['jl.account_id = ?']
  const params: any[] = [accountId]
  if (from) { where.push('je.entry_date >= ?'); params.push(from) }
  if (to) { where.push('je.entry_date <= ?'); params.push(to) }
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query(
      `SELECT je.entry_date, je.reference, je.description, jl.debit, jl.credit
       FROM journal_lines jl
       JOIN journal_entries je ON je.id = jl.entry_id
       WHERE ${where.join(' AND ')}
       ORDER BY je.entry_date, jl.id`,
      params
    )
    return NextResponse.json({ success: true, data: rows })
  } finally {
    conn.release()
  }
}


