import { NextRequest, NextResponse } from "next/server";
import { executeQueryOnUserDB } from "@/lib/dbHelper";
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

export async function GET(request: NextRequest) {
  try {
    const dbName = await getUserDatabaseFromRequest(request);
    if (!dbName) {
      return NextResponse.json(
        { success: false, message: 'Unable to determine user database' },
        { status: 401 }
      );
    }

    const tables = await executeQueryOnUserDB(dbName, async (connection) => {
      const selectQuery = `
        SELECT * FROM tables 
        ORDER BY table_number ASC
      `;

      const [rows] = await connection.execute(selectQuery);
      return rows;
    });

    return NextResponse.json({
      success: true,
      data: tables,
    });
  } catch (error: any) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { success: false, message: error.message || "خطا در دریافت اطلاعات میزها" },
      { status: error.status || 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await getEnhancedAuth(request);
  if (!hasPermission(auth, 'manage_tables')) {
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

    const body = await request.json();
    const { tableNumber, capacity, location, description } = body;

    if (!tableNumber) {
      return NextResponse.json(
        { success: false, message: "شماره میز الزامی است" },
        { status: 400 }
      );
    }

    await executeQueryOnUserDB(dbName, async (connection) => {
      // Check if table number already exists
      const [existingRows] = await connection.execute(
        "SELECT id FROM tables WHERE table_number = ?",
        [tableNumber]
      );

      if ((existingRows as any[]).length > 0) {
        throw { status: 400, message: "میز با این شماره قبلاً ثبت شده است" };
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
    });

    return NextResponse.json({
      success: true,
      message: "میز با موفقیت اضافه شد",
    });
  } catch (error: any) {
    console.error("Error creating table:", error);
    return NextResponse.json(
      { success: false, message: error.message || "خطا در ایجاد میز" },
      { status: error.status || 500 }
    );
  }
}
