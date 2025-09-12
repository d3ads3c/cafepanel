import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

// PUT - Update status
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } } | Promise<{ params: { id: string } }>
) {
  // Await context if it's a promise
  const { params } = await context;
  const body = await request.json();
  const { bl_status } = body;
  const statusString =
    bl_status === true || bl_status === "true" ? "true" : "false";
  const id = Number(params.id);

  if (bl_status !== "true" && bl_status !== "false") {
    return NextResponse.json(
      { success: false, message: "وضعیت نامعتبر است" },
      { status: 400 }
    );
  }

  if (isNaN(id)) {
    return NextResponse.json(
      { success: false, message: "شناسه نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const connection = await pool.getConnection();
    await connection.execute(
      "UPDATE buylist SET bl_status = ? WHERE bl_ID = ?",
      [statusString, id]
    );
    connection.release();

    return NextResponse.json({
      success: true,
      message: "وضعیت به‌روزرسانی شد",
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "خطا در پایگاه داده" },
      { status: 500 }
    );
  }
}

// DELETE - Remove item
export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } } | Promise<{ params: { id: string } }>
) {
  const { params } = await context;
  const id = Number(params.id);
  if (isNaN(id)) {
    return NextResponse.json(
      { success: false, message: "شناسه نامعتبر است" },
      { status: 400 }
    );
  }

  try {
    const connection = await pool.getConnection();
    await connection.execute("DELETE FROM buylist WHERE bl_ID = ?", [id]);
    connection.release();

    return NextResponse.json({ success: true, message: "آیتم حذف شد" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "خطا در پایگاه داده" },
      { status: 500 }
    );
  }
}
