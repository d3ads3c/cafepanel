import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// POST - Create accounting entries for completed orders
export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  let connection;
  try {
    const body = await request.json();
    const { orderId, orderData } = body;

    if (!orderId || !orderData) {
      return NextResponse.json(
        { success: false, message: 'Order ID and data are required' },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Create journal entry for the order
      const journalEntryQuery = `
        INSERT INTO accounting_journal_entries 
        (entry_date, reference, description, created_at) 
        VALUES (?, ?, ?, NOW())
      `;
      
      const [journalResult] = await connection.execute(journalEntryQuery, [
        orderData.createdAt || new Date().toISOString().split('T')[0],
        `ORDER-${orderId}`,
        `سفارش #${orderId} - ${orderData.customerName || 'مشتری ناشناس'}`
      ]);
      
      const journalEntryId = (journalResult as any).insertId;

      // Get or create necessary accounts
      const getAccountQuery = `SELECT id FROM accounting_accounts WHERE code = ?`;
      
      // Revenue account (درآمد فروش)
      let [revenueAccount] = await connection.execute(getAccountQuery, ['4001']);
      if (!(revenueAccount as any[]).length) {
        const createRevenueQuery = `
          INSERT INTO accounting_accounts (code, name, type, parent_id) 
          VALUES ('4001', 'درآمد فروش', 'revenue', NULL)
        `;
        await connection.execute(createRevenueQuery);
        [revenueAccount] = await connection.execute(getAccountQuery, ['4001']);
      }
      const revenueAccountId = (revenueAccount as any[])[0].id;

      // Cash account (موجودی نقدی)
      let [cashAccount] = await connection.execute(getAccountQuery, ['1001']);
      if (!(cashAccount as any[]).length) {
        const createCashQuery = `
          INSERT INTO accounting_accounts (code, name, type, parent_id) 
          VALUES ('1001', 'موجودی نقدی', 'asset', NULL)
        `;
        await connection.execute(createCashQuery);
        [cashAccount] = await connection.execute(getAccountQuery, ['1001']);
      }
      const cashAccountId = (cashAccount as any[])[0].id;

      // Create journal lines
      const insertLineQuery = `
        INSERT INTO accounting_journal_lines 
        (journal_entry_id, account_id, debit, credit, line_description) 
        VALUES (?, ?, ?, ?, ?)
      `;

      // Revenue line (credit)
      await connection.execute(insertLineQuery, [
        journalEntryId,
        revenueAccountId,
        0,
        orderData.totalPrice,
        `فروش سفارش #${orderId}`
      ]);

      // Cash line (debit)
      await connection.execute(insertLineQuery, [
        journalEntryId,
        cashAccountId,
        orderData.totalPrice,
        0,
        `دریافت نقدی سفارش #${orderId}`
      ]);

      // Create payment record
      const paymentQuery = `
        INSERT INTO accounting_payments 
        (invoice_id, amount, payment_method, payment_date, description, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      
      await connection.execute(paymentQuery, [
        orderId, // Using order ID as invoice reference
        orderData.totalPrice,
        orderData.paymentMethod || 'نقدی',
        orderData.createdAt || new Date().toISOString().split('T')[0],
        `پرداخت سفارش #${orderId}`
      ]);

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: 'Accounting entries created successfully',
        data: {
          journalEntryId,
          revenueAccountId,
          cashAccountId
        }
      });

    } catch (dbError) {
      await connection.rollback();
      console.error('Database error in accounting integration:', dbError);
      throw dbError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error creating accounting entries:', error);
    return NextResponse.json(
      { 
        success: false,
        message: `خطا در ایجاد سند حسابداری: ${error instanceof Error ? error.message : 'خطای نامشخص'}` 
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// GET - Fetch orders that need accounting integration
export async function GET(request: NextRequest) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    // Get completed orders that haven't been integrated yet
    const query = `
      SELECT 
        o.order_ID as id,
        o.customer_name,
        o.table_number,
        o.total_price,
        o.payment_method,
        o.created_at,
        o.updated_at,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'item_name', oi.item_name,
            'item_price', oi.item_price,
            'quantity', oi.quantity
          )
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_ID = oi.order_ID
      LEFT JOIN accounting_payments ap ON o.order_ID = ap.invoice_id
      WHERE o.status = 'completed' 
        AND ap.id IS NULL
      GROUP BY o.order_ID
      ORDER BY o.created_at DESC
    `;
    
    const [rows] = await connection.execute(query);
    connection.release();

    const orders = (rows as any[]).map(row => ({
      id: row.id,
      customerName: row.customer_name,
      tableNumber: row.table_number,
      totalPrice: row.total_price,
      paymentMethod: row.payment_method,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: row.items ? JSON.parse(row.items) : []
    }));

    return NextResponse.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching orders for integration:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'خطا در دریافت سفارشات' 
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
