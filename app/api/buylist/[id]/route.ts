import { NextRequest, NextResponse } from "next/server";
import { executeQueryOnUserDB } from "@/lib/dbHelper";
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// PUT - Update status
export async function PUT(request: NextRequest) {
  const auth = await getEnhancedAuth(request);
  if (!hasPermission(auth, 'manage_buylist')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  const dbName = await getUserDatabaseFromRequest(request);
  if (!dbName) {
    return NextResponse.json(
      { success: false, message: 'Unable to determine user database' },
      { status: 401 }
    );
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
    await executeQueryOnUserDB(dbName, async (connection) => {
      await connection.execute(
        "UPDATE buylist SET bl_status = ? WHERE bl_ID = ?",
        [statusString, id]
      );
    });

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
  request: NextRequest
) {
  const auth = await getEnhancedAuth(request);
  if (!hasPermission(auth, 'manage_buylist')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  const dbName = await getUserDatabaseFromRequest(request);
  if (!dbName) {
    return NextResponse.json(
      { success: false, message: 'Unable to determine user database' },
      { status: 401 }
    );
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
    await executeQueryOnUserDB(dbName, async (connection) => {
      await connection.execute("DELETE FROM buylist WHERE bl_ID = ?", [id]);
    });

    return NextResponse.json({ success: true, message: "آیتم حذف شد" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "خطا در پایگاه داده" },
      { status: 500 }
    );
  }
}
