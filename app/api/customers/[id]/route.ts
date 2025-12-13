import { NextRequest, NextResponse } from "next/server";
import { executeQueryOnUserDB } from "@/lib/dbHelper";
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

export async function GET(
  request: NextRequest
) {
  const auth = await getEnhancedAuth(request);
  if (!hasPermission(auth, 'manage_customers')) {
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
    const match = pathname.match(/\/api\/customers\/([^/]+)(?:\/)?$/);
    const customerId = match?.[1];
    
    const customer = await executeQueryOnUserDB(dbName, async (connection) => {
      const selectQuery = `
        SELECT 
          c.id, c.name, c.phone, c.email, c.address, c.notes, c.created_at, c.updated_at,
          c.discount_type, c.discount_value,
          COUNT(o.order_ID) as total_orders,
          COALESCE(SUM(o.total_price), 0) as total_spent,
          MAX(o.created_at) as last_order_date
        FROM customers c
        LEFT JOIN orders o ON c.name = o.customer_name
        WHERE c.id = ?
        GROUP BY c.id
      `;
      
      const [rows] = await connection.execute(selectQuery, [customerId]);

      if ((rows as any[]).length === 0) {
        throw { status: 404, message: "مشتری یافت نشد" };
      }

      return (rows as any[])[0];
    });

    return NextResponse.json({
      success: true,
      data: customer,
    });
  } catch (error: any) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { success: false, message: error.message || "خطا در دریافت اطلاعات مشتری" },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest
) {
  const auth = await getEnhancedAuth(request);
  if (!hasPermission(auth, 'manage_customers')) {
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

    const { name, phone, email, address, notes, discount_type, discount_value } = await request.json();
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/customers\/([^/]+)(?:\/)?$/);
    const customerId = match?.[1];

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "نام و شماره تلفن الزامی است" },
        { status: 400 }
      );
    }

    await executeQueryOnUserDB(dbName, async (connection) => {
      // Check if customer exists
      const [existingRows] = await connection.execute(
        "SELECT id FROM customers WHERE id = ?",
        [customerId]
      );

      if ((existingRows as any[]).length === 0) {
        throw { status: 404, message: "مشتری یافت نشد" };
      }

      // Check if phone number is already used by another customer
      const [phoneCheckRows] = await connection.execute(
        "SELECT id FROM customers WHERE phone = ? AND id != ?",
        [phone, customerId]
      );

      if ((phoneCheckRows as any[]).length > 0) {
        throw { status: 400, message: "مشتری با این شماره تلفن قبلاً ثبت شده است" };
      }

      await connection.execute(
        `UPDATE customers 
         SET name = ?, phone = ?, email = ?, address = ?, notes = ?, discount_type = ?, discount_value = ?, updated_at = NOW()
         WHERE id = ?`,
        [name, phone, email || null, address || null, notes || null, discount_type || null, discount_value ?? null, customerId]
      );
    });

    return NextResponse.json({
      success: true,
      message: "مشتری با موفقیت ویرایش شد",
    });
  } catch (error: any) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { success: false, message: error.message || "خطا در ویرایش مشتری" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
  const auth = await getEnhancedAuth(request);
  if (!hasPermission(auth, 'manage_customers')) {
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
    const match = pathname.match(/\/api\/customers\/([^/]+)(?:\/)?$/);
    const customerId = match?.[1];

    await executeQueryOnUserDB(dbName, async (connection) => {
      // Check if customer exists
      const [existingRows] = await connection.execute(
        "SELECT id FROM customers WHERE id = ?",
        [customerId]
      );

      if ((existingRows as any[]).length === 0) {
        throw { status: 404, message: "مشتری یافت نشد" };
      }

      // Check if customer has orders
      const [customerNameRows] = await connection.execute(
        "SELECT name FROM customers WHERE id = ?",
        [customerId]
      );
      
      if ((customerNameRows as any[]).length === 0) {
        throw { status: 404, message: "مشتری یافت نشد" };
      }
      
      const customerName = (customerNameRows as any[])[0].name;
      
      const [ordersCheckRows] = await connection.execute(
        "SELECT COUNT(*) as order_count FROM orders WHERE customer_name = ?",
        [customerName]
      );

      const orderCount = parseInt((ordersCheckRows as any[])[0].order_count);
      
      if (orderCount > 0) {
        throw { 
          status: 400, 
          message: `این مشتری ${orderCount} سفارش دارد و نمی‌توان حذف کرد` 
        };
      }

      await connection.execute("DELETE FROM customers WHERE id = ?", [customerId]);
    });

    return NextResponse.json({
      success: true,
      message: "مشتری با موفقیت حذف شد",
    });
  } catch (error: any) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { success: false, message: error.message || "خطا در حذف مشتری" },
      { status: error.status || 500 }
    );
  }
}
