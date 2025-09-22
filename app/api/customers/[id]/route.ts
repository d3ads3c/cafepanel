import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await pool.getConnection();
    
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
    
    const [rows] = await connection.execute(selectQuery, [params.id]);
    connection.release();

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { success: false, message: "مشتری یافت نشد" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (rows as any[])[0],
    });
  } catch (error) {
    console.error("Error fetching customer:", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت اطلاعات مشتری" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { name, phone, email, address, notes, discount_type, discount_value } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "نام و شماره تلفن الزامی است" },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    // Check if customer exists
    const [existingRows] = await connection.execute(
      "SELECT id FROM customers WHERE id = ?",
      [params.id]
    );

    if ((existingRows as any[]).length === 0) {
      connection.release();
      return NextResponse.json(
        { success: false, message: "مشتری یافت نشد" },
        { status: 404 }
      );
    }

    // Check if phone number is already used by another customer
    const [phoneCheckRows] = await connection.execute(
      "SELECT id FROM customers WHERE phone = ? AND id != ?",
      [phone, params.id]
    );

    if ((phoneCheckRows as any[]).length > 0) {
      connection.release();
      return NextResponse.json(
        { success: false, message: "مشتری با این شماره تلفن قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    await connection.execute(
      `UPDATE customers 
       SET name = ?, phone = ?, email = ?, address = ?, notes = ?, discount_type = ?, discount_value = ?, updated_at = NOW()
       WHERE id = ?`,
      [name, phone, email || null, address || null, notes || null, discount_type || null, discount_value ?? null, params.id]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      message: "مشتری با موفقیت ویرایش شد",
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ویرایش مشتری" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const connection = await pool.getConnection();

    // Check if customer exists
    const [existingRows] = await connection.execute(
      "SELECT id FROM customers WHERE id = ?",
      [params.id]
    );

    if ((existingRows as any[]).length === 0) {
      connection.release();
      return NextResponse.json(
        { success: false, message: "مشتری یافت نشد" },
        { status: 404 }
      );
    }

    // Check if customer has orders
    const [customerNameRows] = await connection.execute(
      "SELECT name FROM customers WHERE id = ?",
      [params.id]
    );
    
    if ((customerNameRows as any[]).length === 0) {
      connection.release();
      return NextResponse.json(
        { success: false, message: "مشتری یافت نشد" },
        { status: 404 }
      );
    }
    
    const customerName = (customerNameRows as any[])[0].name;
    
    const [ordersCheckRows] = await connection.execute(
      "SELECT COUNT(*) as order_count FROM orders WHERE customer_name = ?",
      [customerName]
    );

    const orderCount = parseInt((ordersCheckRows as any[])[0].order_count);
    
    if (orderCount > 0) {
      connection.release();
      return NextResponse.json(
        { 
          success: false, 
          message: `این مشتری ${orderCount} سفارش دارد و نمی‌توان حذف کرد` 
        },
        { status: 400 }
      );
    }

    await connection.execute("DELETE FROM customers WHERE id = ?", [params.id]);
    connection.release();

    return NextResponse.json({
      success: true,
      message: "مشتری با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json(
      { success: false, message: "خطا در حذف مشتری" },
      { status: 500 }
    );
  }
}
