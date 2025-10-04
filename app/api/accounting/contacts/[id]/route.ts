import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'
import { db } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth()
    if (!hasPermission(auth, 'manage_accounting')) {
      return NextResponse.json({ success: false, message: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    const [contacts] = await db.execute(
      'SELECT * FROM accounting_contacts WHERE id = ?',
      [params.id]
    )

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json({ success: false, message: 'مخاطب یافت نشد' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: contacts[0] })
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json({ success: false, message: 'خطا در دریافت مخاطب' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    await db.execute(
      'UPDATE accounting_contacts SET name = ?, type = ?, phone = ?, email = ?, address = ?, notes = ?, updated_at = NOW() WHERE id = ?',
      [name, type, phone, email || null, address || null, notes || null, params.id]
    )

    return NextResponse.json({ success: true, message: 'مخاطب با موفقیت ویرایش شد' })
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json({ success: false, message: 'خطا در ویرایش مخاطب' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await getAuth()
    if (!hasPermission(auth, 'manage_accounting')) {
      return NextResponse.json({ success: false, message: 'دسترسی غیرمجاز' }, { status: 403 })
    }

    // Check if contact has any invoices
    const [invoices] = await db.execute(
      'SELECT COUNT(*) as count FROM invoices WHERE contact_id = ?',
      [params.id]
    )

    if (Array.isArray(invoices) && (invoices[0] as any).count > 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'نمی‌توان مخاطبی که فاکتور دارد را حذف کرد' 
      }, { status: 400 })
    }

    await db.execute('DELETE FROM accounting_contacts WHERE id = ?', [params.id])

    return NextResponse.json({ success: true, message: 'مخاطب با موفقیت حذف شد' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json({ success: false, message: 'خطا در حذف مخاطب' }, { status: 500 })
  }
}
