import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const auth = await getAuth()
    if (!hasPermission(auth, 'manage_accounting')) {
      return NextResponse.json({ success: false, message: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const [contacts] = await db.execute(`
      SELECT 
        c.*,
        COUNT(i.id) as total_invoices,
        COALESCE(SUM(i.final_amount), 0) as total_amount,
        MAX(i.created_at) as last_invoice_date,
        COUNT(CASE WHEN i.payment_status != 'paid' AND i.payment_status != 'cancelled' THEN 1 END) as unpaid_count,
        COALESCE(SUM(CASE WHEN i.payment_status != 'paid' AND i.payment_status != 'cancelled' THEN i.final_amount ELSE 0 END), 0) as unpaid_total
      FROM accounting_contacts c
      LEFT JOIN invoices i ON c.id = i.contact_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `)

    return NextResponse.json({ success: true, data: contacts })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json({ success: false, message: 'خطا در دریافت مخاطبین' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth()
    if (!hasPermission(auth, 'manage_accounting')) {
      return NextResponse.json({ success: false, message: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const body = await request.json()
    const { name, type, phone, email, address, notes } = body

    if (!name || !type || !phone) {
      return NextResponse.json({ success: false, message: 'نام، نوع و شماره تلفن الزامی است' }, { status: 400 })
    }

    const [result] = await db.execute(
      'INSERT INTO accounting_contacts (name, type, phone, email, address, notes, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, type, phone, email || null, address || null, notes || null]
    )

    return NextResponse.json({ 
      success: true, 
      message: 'مخاطب با موفقیت اضافه شد',
      data: { id: (result as any).insertId }
    })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json({ success: false, message: 'خطا در ایجاد مخاطب' }, { status: 500 })
  }
}
