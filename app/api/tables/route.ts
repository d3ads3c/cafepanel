import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET() {
  try {
    const connection = await pool.getConnection();

    const selectQuery = `
      SELECT * FROM tables 
      ORDER BY table_number ASC
    `;

    const [rows] = await connection.execute(selectQuery);
    connection.release();

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت اطلاعات میزها" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tableNumber, capacity, location, description } = body;

    if (!tableNumber) {
      return NextResponse.json(
        { success: false, message: "شماره میز الزامی است" },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    // Check if table number already exists
    const [existingRows] = await connection.execute(
      "SELECT id FROM tables WHERE table_number = ?",
      [tableNumber]
    );

    if ((existingRows as any[]).length > 0) {
      connection.release();
      return NextResponse.json(
        { success: false, message: "میز با این شماره قبلاً ثبت شده است" },
        { status: 400 }
      );
    }

    const insertQuery = `
      INSERT INTO tables (table_number, capacity, location, description, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'available', NOW(), NOW())
    `;

    await connection.execute(insertQuery, [
      tableNumber,
      capacity || 4,
      location || "",
      description || "",
    ]);

    connection.release();

    return NextResponse.json({
      success: true,
      message: "میز با موفقیت اضافه شد",
    });
  } catch (error) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      { success: false, message: "خطا در ایجاد میز" },
      { status: 500 }
    );
  }
}
