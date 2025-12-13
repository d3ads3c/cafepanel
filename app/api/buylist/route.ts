import { NextRequest, NextResponse } from "next/server";
import { executeQueryOnUserDB } from "@/lib/dbHelper";
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// GET all buylist items
export async function GET(request: NextRequest) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_buylist')) {
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

    const buylist = await executeQueryOnUserDB(dbName, async (connection) => {
      const [rows] = await connection.execute("SELECT * FROM buylist");
      return rows;
    });
    return NextResponse.json({ success: true, data: buylist });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "DB error" },
      { status: 500 }
    );
  }
}

// POST new buylist item
export async function POST(request: NextRequest) {
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
  const { bl_item, bl_info } = body;

  if (!bl_item) {
    return NextResponse.json(
      { success: false, message: "نام مورد الزامی است" },
      { status: 400 }
    );
  }

  try {
    await executeQueryOnUserDB(dbName, async (connection) => {
      await connection.execute(
        "INSERT INTO buylist (bl_item, bl_info, bl_status) VALUES (?, ?, ?)",
        [bl_item, bl_info || "", "false"]
      );
    });

    return NextResponse.json({ success: true, message: "آیتم اضافه شد" });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "DB error" },
      { status: 500 }
    );
  }
}
