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
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const where: string[] = []
  const params: any[] = []
  if (from) { where.push('entry_date >= ?'); params.push(from) }
  if (to) { where.push('entry_date <= ?'); params.push(to) }
  const sqlWhere = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const conn = await pool.getConnection()
  try {
    const [rows] = await conn.query(
      `SELECT je.*, 
              SUM(jl.debit) as total_debit, 
              SUM(jl.credit) as total_credit
       FROM journal_entries je
       LEFT JOIN journal_lines jl ON jl.entry_id = je.id
       ${sqlWhere}
       GROUP BY je.id
       ORDER BY je.entry_date DESC, je.id DESC`,
      params
    )
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
  const { entry_date, reference, description, lines } = body || {}
  if (!entry_date || !Array.isArray(lines) || lines.length < 2) {
    return NextResponse.json({ success: false, message: 'invalid' }, { status: 400 })
  }
  const totalDebit = lines.reduce((s: number, l: any) => s + Number(l.debit||0), 0)
  const totalCredit = lines.reduce((s: number, l: any) => s + Number(l.credit||0), 0)
  if (Math.round(totalDebit*100) !== Math.round(totalCredit*100)) {
    return NextResponse.json({ success: false, message: 'not balanced' }, { status: 400 })
  }
  const conn = await pool.getConnection()
  try {
    await conn.beginTransaction()
    const [res] = await conn.execute(
      'INSERT INTO journal_entries (entry_date, reference, description, created_by) VALUES (?,?,?,?)',
      [entry_date, reference || null, description || null, auth?.userId || null]
    )
    const entryId = (res as any).insertId
    for (const l of lines) {
      await conn.execute(
        'INSERT INTO journal_lines (entry_id, account_id, debit, credit, line_description) VALUES (?,?,?,?,?)',
        [entryId, l.account_id, Number(l.debit||0), Number(l.credit||0), l.line_description || null]
      )
    }
    await conn.commit()
    return NextResponse.json({ success: true, data: { id: entryId } }, { status: 201 })
  } catch (e: any) {
    await conn.rollback()
    return NextResponse.json({ success: false, message: e?.message || 'error' }, { status: 500 })
  } finally {
    conn.release()
  }
}


