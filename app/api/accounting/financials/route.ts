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
  const to = searchParams.get('to')
  const params: any[] = []
  const whereDate = to ? 'AND je.entry_date <= ?' : ''
  if (to) params.push(to)
  const conn = await pool.getConnection()
  try {
    // Balance Sheet group by type
    const [balances] = await conn.query(
      `SELECT a.type, COALESCE(SUM(jl.debit - jl.credit),0) as balance
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id = a.id
       LEFT JOIN journal_entries je ON je.id = jl.entry_id
       WHERE 1=1 ${whereDate}
       GROUP BY a.type` , params)
    // Income Statement: revenue - expense
    const [income] = await conn.query(
      `SELECT 
          COALESCE(SUM(CASE WHEN a.type = 'revenue' THEN (jl.credit - jl.debit) ELSE 0 END),0) as revenue,
          COALESCE(SUM(CASE WHEN a.type = 'expense' THEN (jl.debit - jl.credit) ELSE 0 END),0) as expense
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id = a.id
       LEFT JOIN journal_entries je ON je.id = jl.entry_id
       WHERE 1=1 ${whereDate}`, params)
    return NextResponse.json({ success: true, data: { balances, income: Array.isArray(income) ? (income as any[])[0] : income } })
  } finally {
    conn.release()
  }
}


