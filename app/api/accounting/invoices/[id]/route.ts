import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET /api/accounting/invoices/[id] - get single invoice with items
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  const invoiceId = parseInt(params.id);
  if (isNaN(invoiceId)) {
    return NextResponse.json({ success: false, message: 'شناسه فاکتور نامعتبر است' }, { status: 400 });
  }

  const connection = await pool.getConnection();
  try {
    // Get invoice details
    const [invoiceRows] = await connection.execute(`
      SELECT 
        i.*,
        u.username as created_by_name
      FROM invoices i
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = ?
    `, [invoiceId]);

    if ((invoiceRows as any[]).length === 0) {
      return NextResponse.json({ success: false, message: 'فاکتور یافت نشد' }, { status: 404 });
    }

    // Get invoice items
    const [itemRows] = await connection.execute(`
      SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id
    `, [invoiceId]);

    const invoice = (invoiceRows as any[])[0];
    const items = itemRows as any[];

    return NextResponse.json({ 
      success: true, 
      data: { ...invoice, items }
    });

  } catch (e) {
    console.error('Error fetching invoice:', e);
    return NextResponse.json({ success: false, message: 'خطا در دریافت فاکتور' }, { status: 500 });
  } finally {
    connection.release();
  }
}

// PUT /api/accounting/invoices/[id] - update invoice
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  const invoiceId = parseInt(params.id);
  if (isNaN(invoiceId)) {
    return NextResponse.json({ success: false, message: 'شناسه فاکتور نامعتبر است' }, { status: 400 });
  }

  const body = await request.json();
  const {
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
  if (!customer_supplier_name || !final_amount) {
    return NextResponse.json({ 
      success: false, 
      message: 'نام مشتری/تأمین‌کننده و مبلغ نهایی الزامی است' 
    }, { status: 400 });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Check if invoice exists
    const [existingRows] = await connection.execute('SELECT id FROM invoices WHERE id = ?', [invoiceId]);
    if ((existingRows as any[]).length === 0) {
      return NextResponse.json({ success: false, message: 'فاکتور یافت نشد' }, { status: 404 });
    }

    // Update invoice
    await connection.execute(`
      UPDATE invoices SET
        customer_supplier_name = ?, customer_supplier_phone = ?, customer_supplier_address = ?,
        total_amount = ?, tax_amount = ?, discount_amount = ?, final_amount = ?,
        payment_method = ?, payment_status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      customer_supplier_name, customer_supplier_phone, customer_supplier_address,
      total_amount, tax_amount, discount_amount, final_amount,
      payment_method, payment_status, notes, invoiceId
    ]);

    // Update invoice items
    if (items && items.length > 0) {
      // Delete existing items
      await connection.execute('DELETE FROM invoice_items WHERE invoice_id = ?', [invoiceId]);

      // Insert new items
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
      message: 'فاکتور با موفقیت بروزرسانی شد'
    });

  } catch (e) {
    await connection.rollback();
    console.error('Error updating invoice:', e);
    return NextResponse.json({ 
      success: false, 
      message: 'خطا در بروزرسانی فاکتور' 
    }, { status: 500 });
  } finally {
    connection.release();
  }
}

// DELETE /api/accounting/invoices/[id] - delete invoice
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  const invoiceId = parseInt(params.id);
  if (isNaN(invoiceId)) {
    return NextResponse.json({ success: false, message: 'شناسه فاکتور نامعتبر است' }, { status: 400 });
  }

  const connection = await pool.getConnection();
  try {
    // Check if invoice exists
    const [existingRows] = await connection.execute('SELECT id FROM invoices WHERE id = ?', [invoiceId]);
    if ((existingRows as any[]).length === 0) {
      return NextResponse.json({ success: false, message: 'فاکتور یافت نشد' }, { status: 404 });
    }

    // Delete invoice (items will be deleted automatically due to CASCADE)
    await connection.execute('DELETE FROM invoices WHERE id = ?', [invoiceId]);

    return NextResponse.json({ 
      success: true, 
      message: 'فاکتور با موفقیت حذف شد'
    });

  } catch (e) {
    console.error('Error deleting invoice:', e);
    return NextResponse.json({ 
      success: false, 
      message: 'خطا در حذف فاکتور' 
    }, { status: 500 });
  } finally {
    connection.release();
  }
}
