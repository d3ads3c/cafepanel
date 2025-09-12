import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// GET all buylist items
export async function GET() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.execute("SELECT * FROM buylist");
    connection.release();
    return NextResponse.json({ success: true, data: rows });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "DB error" },
      { status: 500 }
    );
  }
}

// POST new buylist item
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { bl_item, bl_info } = body;

  if (!bl_item) {
    return NextResponse.json(
      { success: false, message: "نام مورد الزامی است" },
      { status: 400 }
    );
  }

  try {
    const connection = await pool.getConnection();
    await connection.execute(
      "INSERT INTO buylist (bl_item, bl_info, bl_status) VALUES (?, ?, ?)",
      [bl_item, bl_info || "", "false"]
    );
    connection.release();

    return NextResponse.json({ success: true, message: "آیتم اضافه شد" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "DB error" },
      { status: 500 }
    );
  }
}
