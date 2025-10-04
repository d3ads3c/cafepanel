import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { getAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// PUT - Update status
export async function PUT(request: Request) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_buylist')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }
  const body = await request.json();
  const { bl_status } = body;
  // Validate that bl_status is either a boolean or "true"/"false" string
  const isValidStatus =
    bl_status === true ||
    bl_status === false ||
    bl_status === "true" ||
    bl_status === "false";

  if (!isValidStatus) {
    return NextResponse.json(
      { success: false, message: "وضعیت نامعتبر است" },
      { status: 400 }
    );
  }

  const statusString = bl_status === true || bl_status === "true" ? "true" : "false";
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/\/api\/buylist\/([^/]+)(?:\/)?$/);
  const idParam = match?.[1];
  const id = Number(idParam);

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
  request: Request
) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_buylist')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }
  const pathname = new URL(request.url).pathname;
  const match = pathname.match(/\/api\/buylist\/([^/]+)(?:\/)?$/);
  const idParam = match?.[1];
  const id = Number(idParam);
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
