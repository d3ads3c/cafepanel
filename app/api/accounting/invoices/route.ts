import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET /api/accounting/invoices - list all invoices
export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(`
      SELECT 
        i.*,
        u.username as created_by_name
      FROM invoices i
      LEFT JOIN users u ON i.created_by = u.id
      ORDER BY i.created_at DESC
    `);
    return NextResponse.json({ success: true, data: rows });
  } catch (e) {
    console.error('Error fetching invoices:', e);
    return NextResponse.json({ success: false, message: 'Failed to fetch invoices' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// POST /api/accounting/invoices - create new invoice
export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const {
    invoice_type,
    customer_supplier_name,
    customer_supplier_phone,
    customer_supplier_address,
    total_amount,
    tax_amount = 0,
    discount_amount = 0,
    final_amount,
    payment_method = 'cash',
    payment_status = 'pending',
    notes,
    items = []
  } = body;

  // Validation
  if (!invoice_type || !customer_supplier_name || !final_amount) {
    return NextResponse.json({ 
      success: false, 
      message: 'نوع فاکتور، نام مشتری/تأمین‌کننده و مبلغ نهایی الزامی است' 
    }, { status: 400 });
  }

  if (!['buy', 'sell'].includes(invoice_type)) {
    return NextResponse.json({ 
      success: false, 
      message: 'نوع فاکتور باید خرید یا فروش باشد' 
    }, { status: 400 });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Generate invoice number
    const [countResult] = await connection.execute(
      'SELECT COUNT(*) as count FROM invoices WHERE invoice_type = ? AND DATE(created_at) = CURDATE()',
      [invoice_type]
    );
    const count = (countResult as any[])[0].count;
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const invoice_number = `${invoice_type.toUpperCase()}-${today}-${String(count + 1).padStart(3, '0')}`;

    // Insert invoice
    const [invoiceResult] = await connection.execute(`
      INSERT INTO invoices (
        invoice_number, invoice_type, customer_supplier_name, customer_supplier_phone,
        customer_supplier_address, total_amount, tax_amount, discount_amount,
        final_amount, payment_method, payment_status, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      invoice_number, invoice_type, customer_supplier_name, customer_supplier_phone,
      customer_supplier_address, total_amount, tax_amount, discount_amount,
      final_amount, payment_method, payment_status, notes, auth?.userId
    ]);

    const invoiceId = (invoiceResult as any).insertId;

    // Insert invoice items
    if (items && items.length > 0) {
      for (const item of items) {
        await connection.execute(`
          INSERT INTO invoice_items (
            invoice_id, item_name, item_description, quantity, unit_price, total_price
          ) VALUES (?, ?, ?, ?, ?, ?)
        `, [
          invoiceId, item.name, item.description, item.quantity, item.unit_price, item.total_price
        ]);
      }
    }

    await connection.commit();

    return NextResponse.json({ 
      success: true, 
      data: { id: invoiceId, invoice_number },
      message: 'فاکتور با موفقیت ایجاد شد'
    }, { status: 201 });

  } catch (e: any) {
    await connection.rollback();
    console.error('Error creating invoice:', e);
    if (e.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ 
        success: false, 
        message: 'شماره فاکتور تکراری است' 
      }, { status: 409 });
    }
    return NextResponse.json({ 
      success: false, 
      message: 'خطا در ایجاد فاکتور' 
    }, { status: 500 });
  } finally {
    connection.release();
  }
}
