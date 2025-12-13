import { NextRequest, NextResponse } from 'next/server';
import { executeTransactionOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// PUT - Update order status and items
export async function PUT(
  request: NextRequest
) {
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

    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/orders\/([^/]+)(?:\/)?$/);
    const orderId = match?.[1];
    const body = await request.json();
    
    // Validate required fields - status is required unless only updating payment method
    if (!body.status && !body.paymentMethod) {
      return NextResponse.json(
        { success: false, message: 'وضعیت سفارش الزامی است' },
        { status: 400 }
      );
    }

    const result = await executeTransactionOnUserDB(dbName, async (connection) => {
      // Get existing order data first
      const [existingOrderData] = await connection.execute(
        'SELECT total_items, total_price, payment_method, order_status, customer_name, table_number FROM orders WHERE order_ID = ?',
        [orderId]
      );

      if (!existingOrderData || (existingOrderData as any[])[0] === undefined) {
        throw { status: 404, message: 'سفارش مورد نظر یافت نشد' };
      }

      const existingOrder = (existingOrderData as any[])[0];

      // If only updating payment method, preserve existing status
      const orderStatus = body.status ?? existingOrder.order_status;
      let totalItems = body.totalItems ?? existingOrder.total_items;
      let totalPrice = body.totalPrice ?? existingOrder.total_price;
      let paymentMethod = body.paymentMethod ?? existingOrder.payment_method;
      const customerName = body.customerName ?? existingOrder.customer_name;
      const tableNumber = body.tableNumber ?? existingOrder.table_number;

      // Update order status and totals
      // Support payment_method
      const updateOrderQuery = `
        UPDATE orders 
        SET order_status = ?, total_items = ?, total_price = ?, updated_at = CURRENT_TIMESTAMP, payment_method = ?, customer_name = ?, table_number = ?
        WHERE order_ID = ?
      `;

      const [orderResult] = await connection.execute(updateOrderQuery, [
        orderStatus,
        totalItems || 0,
        totalPrice || 0,
        paymentMethod,
        customerName,
        tableNumber,
        orderId
      ]);

      if ((orderResult as any).affectedRows === 0) {
        throw { status: 404, message: 'سفارش مورد نظر یافت نشد' };
      }

      // If items are provided, update order items
      if (body.items && Array.isArray(body.items)) {
        // Delete existing order items
        await connection.execute(
          'DELETE FROM order_items WHERE order_ID = ?',
          [orderId]
        );

        // Insert new order items
        for (const item of body.items) {
          await connection.execute(
            `INSERT INTO order_items (order_ID, menu_ID, item_name, item_price, quantity) 
             VALUES (?, ?, ?, ?, ?)`,
            [orderId, item.menu_ID, item.item_name, item.item_price, item.quantity]
          );
        }
      }

      return {
        id: orderId,
        status: orderStatus,
        totalItems: totalItems,
        totalPrice: totalPrice,
        paymentMethod,
        customerName
      };
    });

    // If order is being completed, create accounting entries (outside transaction)
    if (body.status === 'completed') {
      try {
        // Fetch order details for accounting
        const orderDetails = await executeQueryOnUserDB(dbName, async (connection) => {
          const [orderRows] = await connection.execute(
            'SELECT customer_name, total_price, payment_method, created_at FROM orders WHERE order_ID = ?',
            [orderId]
          );
          return (orderRows as any[])[0];
        });

        if (orderDetails) {
          const accountingResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/accounting/orders-integration`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: orderId,
              orderData: {
                customerName: orderDetails.customer_name,
                totalPrice: orderDetails.total_price,
                paymentMethod: orderDetails.payment_method,
                createdAt: orderDetails.created_at
              }
            })
          });
          
          if (!accountingResponse.ok) {
            console.error('Failed to create accounting entries for order:', orderId);
          }
        }
      } catch (accountingError) {
        console.error('Error creating accounting entries:', accountingError);
        // Don't fail the order update if accounting fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'سفارش با موفقیت بروزرسانی شد',
      data: result
    });

  } catch (error: any) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'خطا در بروزرسانی سفارش' 
      },
      { status: error.status || 500 }
    );
  }
}

// DELETE - Delete order
export async function DELETE(
  request: NextRequest
) {
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

    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/orders\/([^/]+)(?:\/)?$/);
    const orderId = match?.[1];

    await executeTransactionOnUserDB(dbName, async (connection) => {
      // Delete order items first
      const deleteItemsQuery = 'DELETE FROM order_items WHERE order_ID = ?';
      await connection.execute(deleteItemsQuery, [orderId]);
      
      // Delete order
      const deleteOrderQuery = 'DELETE FROM orders WHERE order_ID = ?';
      const [result] = await connection.execute(deleteOrderQuery, [orderId]);
      
      if ((result as any).affectedRows === 0) {
        throw { status: 404, message: 'سفارش مورد نظر یافت نشد' };
      }
    });
    
    return NextResponse.json(
      { success: true, message: 'سفارش با موفقیت حذف شد' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در حذف سفارش' },
      { status: error.status || 500 }
    );
  }
}
