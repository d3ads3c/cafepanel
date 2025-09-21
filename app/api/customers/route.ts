import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const selectQuery = `
      SELECT 
        c.*,
        COUNT(o.order_ID) as total_orders,
        COALESCE(SUM(o.total_price), 0) as total_spent,
        MAX(o.created_at) as last_order_date
      FROM customers c
      LEFT JOIN orders o ON c.name = o.customer_name
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `;
    
    const [rows] = await connection.execute(selectQuery);
    connection.release();

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت اطلاعات مشتریان" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function POST(request: NextRequest) {
  let connection;
  try {
    const { name, phone, email, address, notes } = await request.json();

    if (!name || !phone) {
      return NextResponse.json(
        { success: false, message: "نام و شماره تلفن الزامی است" },
        { status: 400 }
      );
    }

    connection = await pool.getConnection();

    // Check if customer with same phone already exists
    const [existingRows] = await connection.execute(
      "SELECT id FROM customers WHERE phone = ?",
      [phone]
    );

    if ((existingRows as any[]).length > 0) {
      connection.release();
      return NextResponse.json(
        { success: false, message: "مشتری با این شماره تلفن قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    const [result] = await connection.execute(
      `INSERT INTO customers (name, phone, email, address, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, phone, email || null, address || null, notes || null]
    );

    connection.release();

    return NextResponse.json({
      success: true,
      data: result,
      message: "مشتری با موفقیت اضافه شد",
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ایجاد مشتری" },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
