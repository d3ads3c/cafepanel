import { NextRequest, NextResponse } from "next/server";
import { executeQueryOnUserDB } from "@/lib/dbHelper";
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

export async function GET(
  request: NextRequest
) {
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

    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/tables\/([^/]+)(?:\/)?$/);
    const idParam = match?.[1];

    const table = await executeQueryOnUserDB(dbName, async (connection) => {
      const selectQuery = `
        SELECT * FROM tables WHERE id = ?
      `;

      const [rows] = await connection.execute(selectQuery, [idParam]);

      if ((rows as any[]).length === 0) {
        throw { status: 404, message: "میز یافت نشد" };
      }

      return (rows as any[])[0];
    });

    return NextResponse.json({
      success: true,
      data: table,
    });
  } catch (error: any) {
    console.error("Error fetching table:", error);
    return NextResponse.json(
      { success: false, message: error.message || "خطا در دریافت اطلاعات میز" },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(
  request: NextRequest
) {
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
    const { tableNumber, capacity, location, description, status } = body;
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/tables\/([^/]+)(?:\/)?$/);
    const idParam = match?.[1];

    await executeQueryOnUserDB(dbName, async (connection) => {
      // Check if table exists
      const [existingRows] = await connection.execute(
        "SELECT id FROM tables WHERE id = ?",
        [idParam]
      );

      if ((existingRows as any[]).length === 0) {
        throw { status: 404, message: "میز یافت نشد" };
      }

      // Check if table number already exists (excluding current table)
      if (tableNumber) {
        const [duplicateRows] = await connection.execute(
          "SELECT id FROM tables WHERE table_number = ? AND id != ?",
          [tableNumber, idParam]
        );

        if ((duplicateRows as any[]).length > 0) {
          throw { status: 400, message: "میز با این شماره قبلاً ثبت شده است" };
        }
      }

      const updateQuery = `
        UPDATE tables 
        SET table_number = COALESCE(?, table_number),
            capacity = COALESCE(?, capacity),
            location = COALESCE(?, location),
            description = COALESCE(?, description),
            status = COALESCE(?, status),
            updated_at = NOW()
        WHERE id = ?
      `;

      await connection.execute(updateQuery, [
        tableNumber,
        capacity,
        location,
        description,
        status,
        idParam,
      ]);
    });

    return NextResponse.json({
      success: true,
      message: "میز با موفقیت به‌روزرسانی شد",
    });
  } catch (error: any) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      { success: false, message: error.message || "خطا در به‌روزرسانی میز" },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
) {
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

    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/tables\/([^/]+)(?:\/)?$/);
    const idParam = match?.[1];

    await executeQueryOnUserDB(dbName, async (connection) => {
      // Check if table exists
      const [existingRows] = await connection.execute(
        "SELECT id FROM tables WHERE id = ?",
        [idParam]
      );

      if ((existingRows as any[]).length === 0) {
        throw { status: 404, message: "میز یافت نشد" };
      }

      // Check if table has active orders
      const [ordersCheckRows] = await connection.execute(
        "SELECT COUNT(*) as order_count FROM orders WHERE table_number = (SELECT table_number FROM tables WHERE id = ?) AND order_status NOT IN ('completed', 'cancelled')",
        [idParam]
      );

      const orderCount = parseInt((ordersCheckRows as any[])[0].order_count);

      if (orderCount > 0) {
        throw {
          status: 400,
          message: `این میز ${orderCount} سفارش فعال دارد و نمی‌توان حذف کرد`,
        };
      }

      await connection.execute("DELETE FROM tables WHERE id = ?", [idParam]);
    });

    return NextResponse.json({
      success: true,
      message: "میز با موفقیت حذف شد",
    });
  } catch (error: any) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { success: false, message: error.message || "خطا در حذف میز" },
      { status: error.status || 500 }
    );
  }
}
