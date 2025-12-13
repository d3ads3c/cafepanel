import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB, executeTransactionOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// GET - Fetch all invoices
export async function GET(request: NextRequest) {
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

    const invoices = await executeQueryOnUserDB(dbName, async (connection) => {
      // Ensure table has all required columns (migration helper)
      try {
        // Check and add contact_id if missing
        const [contactIdCheck] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'invoices' 
          AND COLUMN_NAME = 'contact_id'
        `);
        if ((contactIdCheck as any[])[0].count === 0) {
          await connection.execute(`ALTER TABLE invoices ADD COLUMN contact_id INT AFTER invoice_type`);
        }

        // Check and add discount_type if missing
        const [discountTypeCheck] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'invoices' 
          AND COLUMN_NAME = 'discount_type'
        `);
        if ((discountTypeCheck as any[])[0].count === 0) {
          await connection.execute(`ALTER TABLE invoices ADD COLUMN discount_type ENUM('percent', 'amount') DEFAULT 'amount' AFTER total_amount`);
        }

        // Check and add discount_value if missing (rename old discount column if exists)
        const [discountValueCheck] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'invoices' 
          AND COLUMN_NAME = 'discount_value'
        `);
        if ((discountValueCheck as any[])[0].count === 0) {
          const [discountCheck] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'invoices' 
            AND COLUMN_NAME = 'discount'
          `);
          if ((discountCheck as any[])[0].count > 0) {
            await connection.execute(`ALTER TABLE invoices CHANGE discount discount_value DECIMAL(15, 2) DEFAULT 0`);
          } else {
            await connection.execute(`ALTER TABLE invoices ADD COLUMN discount_value DECIMAL(15, 2) DEFAULT 0 AFTER discount_type`);
          }
        }

        // Check and add tax_type if missing
        const [taxTypeCheck] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'invoices' 
          AND COLUMN_NAME = 'tax_type'
        `);
        if ((taxTypeCheck as any[])[0].count === 0) {
          await connection.execute(`ALTER TABLE invoices ADD COLUMN tax_type ENUM('percent', 'amount') DEFAULT 'amount' AFTER discount_value`);
        }

        // Check and add tax_value if missing (rename old tax column if exists)
        const [taxValueCheck] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'invoices' 
          AND COLUMN_NAME = 'tax_value'
        `);
        if ((taxValueCheck as any[])[0].count === 0) {
          const [taxCheck] = await connection.execute(`
            SELECT COUNT(*) as count 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'invoices' 
            AND COLUMN_NAME = 'tax'
          `);
          if ((taxCheck as any[])[0].count > 0) {
            await connection.execute(`ALTER TABLE invoices CHANGE tax tax_value DECIMAL(15, 2) DEFAULT 0`);
          } else {
            await connection.execute(`ALTER TABLE invoices ADD COLUMN tax_value DECIMAL(15, 2) DEFAULT 0 AFTER tax_type`);
          }
        }

        // Check and add due_date if missing
        const [dueDateCheck] = await connection.execute(`
          SELECT COUNT(*) as count 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_SCHEMA = DATABASE() 
          AND TABLE_NAME = 'invoices' 
          AND COLUMN_NAME = 'due_date'
        `);
        if ((dueDateCheck as any[])[0].count === 0) {
          await connection.execute(`ALTER TABLE invoices ADD COLUMN due_date DATE AFTER invoice_date`);
        }
      } catch (e) {
        console.error('Error migrating table columns:', e);
        // Continue anyway, will fail on query if columns are missing
      }

      const selectQuery = `
        SELECT 
          id,
          invoice_number,
          invoice_type,
          contact_id,
          contact_name,
          total_amount,
          discount_type,
          discount_value,
          tax_type,
          tax_value,
          final_amount,
          payment_status,
          invoice_date,
          due_date,
          notes,
          created_at
        FROM invoices
        ORDER BY created_at DESC
      `;
      
      const [rows] = await connection.execute(selectQuery);
      return rows as any[];
    });

    return NextResponse.json({
      success: true,
      data: invoices
    });

  } catch (error: any) {
    console.error('Error fetching invoices:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت فاکتورها',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create new invoice
export async function POST(request: NextRequest) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  try {
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
      // Check for duplicate invoice number
      const [duplicateCheck] = await connection.execute(
        'SELECT id FROM invoices WHERE invoice_number = ?',
        [body.invoice_number]
      );
      
      if ((duplicateCheck as any[]).length > 0) {
        throw { status: 400, message: 'شماره فاکتور تکراری است. لطفا شماره دیگری انتخاب کنید' };
      }
      // Insert invoice
      const insertQuery = `
        INSERT INTO invoices 
        (invoice_number, invoice_type, contact_id, contact_name, total_amount, discount_type, discount_value, tax_type, tax_value, final_amount, payment_status, invoice_date, due_date, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        body.notes || null
      ];

      const [insertResult] = await connection.execute(insertQuery, values);
      const invoiceId = (insertResult as any).insertId;

      // Insert invoice items if provided
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

      // Fetch the created invoice
      const [invoiceRows] = await connection.execute(
        'SELECT * FROM invoices WHERE id = ?',
        [invoiceId]
      );

      return (invoiceRows as any[])[0];
    });

    return NextResponse.json({
      success: true,
      message: 'فاکتور با موفقیت ثبت شد',
      data: result
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating invoice:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'خطا در ثبت فاکتور',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: error.status || 500 }
    );
  }
}

