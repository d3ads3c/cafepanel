import { NextRequest, NextResponse } from "next/server";
import { executeQuery } from "@/lib/dbHelper";
import { getAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function GET() {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_customers')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }
  try {
    const data = await executeQuery(async (connection) => {
      const selectQuery = `
        SELECT 
          c.id, c.name, c.phone, c.email, c.address, c.notes, c.created_at, c.updated_at,
          c.discount_type, c.discount_value,
          COUNT(o.order_ID) as total_orders,
          COALESCE(SUM(o.total_price), 0) as total_spent,
          MAX(o.created_at) as last_order_date,
          COALESCE(u.unpaid_count, 0) AS unpaid_count,
          COALESCE(u.unpaid_total, 0) AS unpaid_total
        FROM customers c
        LEFT JOIN orders o 
          ON c.name = o.customer_name
         AND o.order_status <> 'cancelled'
        LEFT JOIN (
          SELECT 
            customer_name,
            COUNT(*) AS unpaid_count,
            COALESCE(SUM(total_price), 0) AS unpaid_total
          FROM orders
          WHERE (payment_method IS NULL OR payment_method = '')
            AND order_status <> 'cancelled'
            AND customer_name IS NOT NULL AND customer_name <> ''
          GROUP BY customer_name
        ) u ON c.name = u.customer_name
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `;
      
      const [rows] = await connection.execute(selectQuery);
      return rows;
    });

    return NextResponse.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت اطلاعات مشتریان" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_customers')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }
  try {
    const { name, phone, email, address, notes, discount_type, discount_value } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "نام و شماره تلفن الزامی است" },
        { status: 400 }
      );
    }

    const result = await executeQuery(async (connection) => {
      // Check if customer with same phone already exists
      const [existingRows] = await connection.execute(
        "SELECT id FROM customers WHERE phone = ?",
        [phone]
      );

      if ((existingRows as any[]).length > 0) {
        throw { status: 400, message: "مشتری با این شماره تلفن قبلاً ثبت شده است" };
      }

      const [insertResult] = await connection.execute(
        `INSERT INTO customers (name, phone, email, address, notes, discount_type, discount_value, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
        [name, phone, email || null, address || null, notes || null, discount_type || null, discount_value ?? null]
      );

      return insertResult;
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: "مشتری با موفقیت اضافه شد",
    });
  } catch (error: any) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { success: false, message: error.message || "خطا در ایجاد مشتری" },
      { status: error.status || 500 }
    );
  }
}
