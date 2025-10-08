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
  const whereDate = to ? 'AND je.entry_date <= ?' : ''
  const params: any[] = []
  if (to) params.push(to)
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query(
      `SELECT a.id, a.code, a.name, a.type,
              COALESCE(SUM(jl.debit),0) as debit,
              COALESCE(SUM(jl.credit),0) as credit,
              COALESCE(SUM(jl.debit - jl.credit),0) as balance
       FROM accounts a
       LEFT JOIN journal_lines jl ON jl.account_id = a.id
       LEFT JOIN journal_entries je ON je.id = jl.entry_id
       WHERE 1=1 ${whereDate}
       GROUP BY a.id
       ORDER BY a.code`,
      params
    )
    return NextResponse.json({ success: true, data: rows })
  } finally {
    conn.release()
  }
}


