import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB, executeTransactionOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// DELETE - Delete an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  try {
    const dbName = await getUserDatabaseFromRequest(request);
    if (!dbName) {
      return NextResponse.json(
        { success: false, message: 'Unable to determine user database' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه فاکتور نامعتبر است' },
        { status: 400 }
      );
    }

    await executeTransactionOnUserDB(dbName, async (connection) => {
      // Check if invoice exists
      const [existingRows] = await connection.execute(
        'SELECT id FROM invoices WHERE id = ?',
        [invoiceId]
      );

      if ((existingRows as any[]).length === 0) {
        throw { status: 404, message: 'فاکتور یافت نشد' };
      }

      // Delete invoice
      await connection.execute(
        'DELETE FROM invoices WHERE id = ?',
        [invoiceId]
      );
    });

    return NextResponse.json({
      success: true,
      message: 'فاکتور با موفقیت حذف شد'
    });

  } catch (error: any) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'خطا در حذف فاکتور' 
      },
      { status: error.status || 500 }
    );
  }
}

// GET - Get single invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه فاکتور نامعتبر است' },
        { status: 400 }
      );
    }

    const dbName = await getUserDatabaseFromRequest(request);
    if (!dbName) {
      return NextResponse.json(
        { success: false, message: 'Unable to determine user database' },
        { status: 401 }
      );
    }

    const invoice = await executeQueryOnUserDB(dbName, async (connection) => {
      const [rows] = await connection.execute(
        'SELECT * FROM invoices WHERE id = ?',
        [invoiceId]
      );
      const invoiceData = (rows as any[])[0] || null;
      
      if (invoiceData) {
        // Fetch invoice items
        const [itemRows] = await connection.execute(
          'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id ASC',
          [invoiceId]
        );
        invoiceData.items = itemRows as any[];
      }
      
      return invoiceData;
    });

    if (!invoice) {
      return NextResponse.json(
        { success: false, message: 'فاکتور یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invoice
    });

  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت فاکتور' },
      { status: 500 }
    );
  }
}

// PUT - Update invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const invoiceId = parseInt(id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه فاکتور نامعتبر است' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate required fields
    if (!body.invoice_number || !body.contact_name || !body.invoice_type) {
      return NextResponse.json(
        { success: false, message: 'فیلدهای الزامی را پر کنید' },
        { status: 400 }
      );
    }

    const dbName = await getUserDatabaseFromRequest(request);
    if (!dbName) {
      return NextResponse.json(
        { success: false, message: 'Unable to determine user database' },
        { status: 401 }
      );
    }

    const result = await executeTransactionOnUserDB(dbName, async (connection) => {
      // Check for duplicate invoice number (excluding current invoice)
      const [duplicateCheck] = await connection.execute(
        'SELECT id FROM invoices WHERE invoice_number = ? AND id != ?',
        [body.invoice_number, invoiceId]
      );
      
      if ((duplicateCheck as any[]).length > 0) {
        throw { status: 400, message: 'شماره فاکتور تکراری است. لطفا شماره دیگری انتخاب کنید' };
      }

      // Check if invoice exists
      const [existingRows] = await connection.execute(
        'SELECT id FROM invoices WHERE id = ?',
        [invoiceId]
      );

      if ((existingRows as any[]).length === 0) {
        throw { status: 404, message: 'فاکتور یافت نشد' };
      }

      // Update invoice
      const updateQuery = `
        UPDATE invoices 
        SET invoice_number = ?, invoice_type = ?, contact_id = ?, contact_name = ?, 
            total_amount = ?, discount_type = ?, discount_value = ?, tax_type = ?, tax_value = ?, 
            final_amount = ?, payment_status = ?, invoice_date = ?, due_date = ?, notes = ?
        WHERE id = ?
      `;
      
      const values = [
        body.invoice_number,
        body.invoice_type,
        body.contact_id || null,
        body.contact_name,
        body.total_amount || 0,
        body.discount_type || 'amount',
        body.discount_value || 0,
        body.tax_type || 'amount',
        body.tax_value || 0,
        body.final_amount || body.total_amount || 0,
        body.payment_status || 'pending',
        body.invoice_date || new Date().toISOString().split('T')[0],
        body.due_date || null,
        body.notes || null,
        invoiceId
      ];

      await connection.execute(updateQuery, values);

      // Delete existing invoice items
      await connection.execute(
        'DELETE FROM invoice_items WHERE invoice_id = ?',
        [invoiceId]
      );

      // Insert new invoice items if provided
      if (body.items && Array.isArray(body.items) && body.items.length > 0) {
        const insertItemQuery = `
          INSERT INTO invoice_items 
          (invoice_id, product_service, quantity, price, total_price, description)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        for (const item of body.items) {
          await connection.execute(insertItemQuery, [
            invoiceId,
            item.product_service,
            item.quantity || 1,
            item.price || 0,
            item.total_price || 0,
            item.description || null
          ]);
        }
      }

      // Fetch the updated invoice
      const [invoiceRows] = await connection.execute(
        'SELECT * FROM invoices WHERE id = ?',
        [invoiceId]
      );

      return (invoiceRows as any[])[0];
    });

    return NextResponse.json({
      success: true,
      message: 'فاکتور با موفقیت به‌روزرسانی شد',
      data: result
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'خطا در به‌روزرسانی فاکتور',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: error.status || 500 }
    );
  }
}

