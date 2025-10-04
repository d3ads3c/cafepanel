import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// PUT - Update order status and items
export async function PUT(
  request: Request
) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_orders')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }
  try {
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/orders\/([^/]+)(?:\/)?$/);
    const orderId = match?.[1];
    const body = await request.json();
    
    // Validate required fields
    if (!body.status) {
      return NextResponse.json(
        { success: false, message: 'وضعیت سفارش الزامی است' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();

             // Update order status and totals
      // Support payment_method
      const updateOrderQuery = `
        UPDATE orders 
        SET order_status = ?, total_items = ?, total_price = ?, updated_at = CURRENT_TIMESTAMP, payment_method = ?
        WHERE order_ID = ?
      `;

      // If only status is being updated (no items provided), preserve existing totals
      let totalItems = body.totalItems;
      let totalPrice = body.totalPrice;
      let paymentMethod = body.paymentMethod ?? null;

      if (!body.items && (body.totalItems === undefined || body.totalPrice === undefined)) {
        // Get existing totals and payment_method from database
        const [existingOrder] = await connection.execute(
          'SELECT total_items, total_price, payment_method FROM orders WHERE order_ID = ?',
          [orderId]
        );
        if (existingOrder && (existingOrder as any[])[0]) {
          const order = (existingOrder as any[])[0];
          totalItems = totalItems ?? order.total_items;
          totalPrice = totalPrice ?? order.total_price;
          paymentMethod = paymentMethod ?? order.payment_method;
        }
      }

      const [orderResult] = await connection.execute(updateOrderQuery, [
        body.status,
        totalItems || 0,
        totalPrice || 0,
        paymentMethod,
        orderId
      ]);

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

      // Commit transaction
      await connection.commit();
      connection.release();

      if ((orderResult as any).affectedRows === 0) {
        return NextResponse.json(
          { success: false, message: 'سفارش مورد نظر یافت نشد' },
          { status: 404 }
        );
      }

      console.log('Order updated:', {
        orderId,
        status: body.status,
        totalItems: totalItems,
        totalPrice: totalPrice,
        paymentMethod,
        itemsCount: body.items?.length || 0
      });

      return NextResponse.json({
        success: true,
        message: 'سفارش با موفقیت بروزرسانی شد',
        data: {
          id: orderId,
          status: body.status,
          totalItems: totalItems,
          totalPrice: totalPrice,
          paymentMethod
        }
      });

    } catch (dbError) {
      // Rollback transaction on error
      await connection.rollback();
      connection.release();
      throw dbError;
    }

  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'خطا در بروزرسانی سفارش' 
      },
      { status: 500 }
    );
  }
}

// DELETE - Delete order
export async function DELETE(
  request: Request
) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_orders')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }
  try {
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/orders\/([^/]+)(?:\/)?$/);
    const orderId = match?.[1];
    const connection = await pool.getConnection();
    
    try {
      // Start transaction
      await connection.beginTransaction();
      
      // Delete order items first
      const deleteItemsQuery = 'DELETE FROM order_items WHERE order_ID = ?';
      await connection.execute(deleteItemsQuery, [orderId]);
      
      // Delete order
      const deleteOrderQuery = 'DELETE FROM orders WHERE order_ID = ?';
      const [result] = await connection.execute(deleteOrderQuery, [orderId]);
      
      // Commit transaction
      await connection.commit();
      
      if ((result as any).affectedRows === 0) {
        return NextResponse.json(
          { success: false, message: 'سفارش مورد نظر یافت نشد' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(
        { success: true, message: 'سفارش با موفقیت حذف شد' },
        { status: 200 }
      );
    } catch (error) {
      // Rollback transaction on error
      await connection.rollback();
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, message: 'خطا در حذف سفارش' },
        { status: 500 }
      );
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در سرور' },
      { status: 500 }
    );
  }
}
