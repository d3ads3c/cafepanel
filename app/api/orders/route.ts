import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB, executeTransactionOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// GET - Fetch all orders
export async function GET(request: NextRequest) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_orders')) {
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

    const orders = await executeQueryOnUserDB(dbName, async (connection) => {
      const selectQuery = `
        SELECT 
          o.order_ID,
          o.customer_name,
          o.table_number,
          o.total_items,
          o.total_price,
          o.order_status,
          o.payment_method,
          o.created_at,
          o.updated_at,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'order_item_ID', oi.order_item_ID,
              'menu_ID', oi.menu_ID,
              'item_name', oi.item_name,
              'item_price', oi.item_price,
              'quantity', oi.quantity
            )
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.order_ID = oi.order_ID
        GROUP BY o.order_ID
        ORDER BY o.created_at DESC
      `;
      
      const [rows] = await connection.execute(selectQuery);

      // Format the data for frontend
      return (rows as any[]).map(row => ({
        id: row.order_ID,
        customerName: row.customer_name,
        tableNumber: row.table_number,
        totalItems: row.total_items,
        totalPrice: row.total_price,
        status: row.order_status,
        paymentMethod: row.payment_method,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: row.items ? JSON.parse(row.items) : []
      }));
    });

    return NextResponse.json({
      success: true,
      data: orders
    });

  } catch (error) {
    console.error('Error fetching orders');
    return NextResponse.json(
      { 
        success: false,
        message: 'خطا در دریافت سفارشات' 
      },
      { status: 500 }
    );
  }
}

// POST - Create new order
export async function POST(request: NextRequest) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_orders')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { success: false, message: 'حداقل یک آیتم باید انتخاب شود' },
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
      // Insert order
      const insertOrderQuery = `
        INSERT INTO orders 
        (customer_name, table_number, total_items, total_price, order_status) 
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const totalItems = body.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      const computedTotalPrice = body.items.reduce((sum: number, item: any) => sum + (parseFloat(item.price) * item.quantity), 0);
      const totalPrice = typeof body.totalPrice === 'number' ? body.totalPrice : computedTotalPrice;
      
      const orderValues = [
        body.customerName || null,
        body.tableNumber || null,
        totalItems,
        totalPrice,
        'pending'
      ];

      const [orderResult] = await connection.execute(insertOrderQuery, orderValues);
      const orderId = (orderResult as any).insertId;

      // Insert order items
      const insertItemQuery = `
        INSERT INTO order_items 
        (order_ID, menu_ID, item_name, item_price, quantity) 
        VALUES (?, ?, ?, ?, ?)
      `;

      for (const item of body.items) {
        const itemValues = [
          orderId,
          item.id,
          item.name,
          item.price,
          item.quantity
        ];
        await connection.execute(insertItemQuery, itemValues);
      }

      console.log('Order created successfully:', {
        orderId,
        customerName: body.customerName,
        totalItems,
        totalPrice
      });

      return {
        id: orderId,
        customerName: body.customerName,
        tableNumber: body.tableNumber,
        totalItems,
        totalPrice,
        status: 'pending'
      };
    });

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت ثبت شد',
      data: result
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating order');
    return NextResponse.json(
      { 
        success: false,
        message: 'خطا در ثبت سفارش' 
      },
      { status: 500 }
    );
  }
}
