import { NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(
  request: Request
) {
  try {
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/tables\/([^/]+)(?:\/)?$/);
    const idParam = match?.[1];
    const connection = await pool.getConnection();

    const selectQuery = `
      SELECT * FROM tables WHERE id = ?
    `;

    const [rows] = await connection.execute(selectQuery, [idParam]);
    connection.release();

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { success: false, message: "میز یافت نشد" },
        { status: 404 }
      );
    }

    const resultRows = rows as any[];
    return NextResponse.json({
      success: true,
      data: resultRows[0],
    });
  } catch (error) {
    console.error("Error fetching table:", error);
    return NextResponse.json(
      { success: false, message: "خطا در دریافت اطلاعات میز" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request
) {
  try {
    const body = await request.json();
    const { tableNumber, capacity, location, description, status } = body;
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/tables\/([^/]+)(?:\/)?$/);
    const idParam = match?.[1];

    const connection = await pool.getConnection();

    // Check if table exists
    const [existingRows] = await connection.execute(
      "SELECT id FROM tables WHERE id = ?",
      [idParam]
    );

    if ((existingRows as any[]).length === 0) {
      connection.release();
      return NextResponse.json(
        { success: false, message: "میز یافت نشد" },
        { status: 404 }
      );
    }

    // Check if table number already exists (excluding current table)
    if (tableNumber) {
      const [duplicateRows] = await connection.execute(
        "SELECT id FROM tables WHERE table_number = ? AND id != ?",
        [tableNumber, idParam]
      );

      if ((duplicateRows as any[]).length > 0) {
        connection.release();
        return NextResponse.json(
          { success: false, message: "میز با این شماره قبلاً ثبت شده است" },
          { status: 400 }
        );
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

    connection.release();

    return NextResponse.json({
      success: true,
      message: "میز با موفقیت به‌روزرسانی شد",
    });
  } catch (error) {
    console.error("Error updating table:", error);
    return NextResponse.json(
      { success: false, message: "خطا در به‌روزرسانی میز" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request
) {
  try {
    const connection = await pool.getConnection();
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/tables\/([^/]+)(?:\/)?$/);
    const idParam = match?.[1];

    // Check if table exists
    const [existingRows] = await connection.execute(
      "SELECT id FROM tables WHERE id = ?",
      [idParam]
    );

    if ((existingRows as any[]).length === 0) {
      connection.release();
      return NextResponse.json(
        { success: false, message: "میز یافت نشد" },
        { status: 404 }
      );
    }

    // Check if table has active orders
    const [ordersCheckRows] = await connection.execute(
      "SELECT COUNT(*) as order_count FROM orders WHERE table_number = (SELECT table_number FROM tables WHERE id = ?) AND status NOT IN ('completed', 'cancelled')",
      [idParam]
    );

    const orderCount = parseInt((ordersCheckRows as any[])[0].order_count);

    if (orderCount > 0) {
      connection.release();
      return NextResponse.json(
        {
          success: false,
          message: `این میز ${orderCount} سفارش فعال دارد و نمی‌توان حذف کرد`,
        },
        { status: 400 }
      );
    }

    await connection.execute("DELETE FROM tables WHERE id = ?", [idParam]);
    connection.release();

    return NextResponse.json({
      success: true,
      message: "میز با موفقیت حذف شد",
    });
  } catch (error) {
    console.error("Error deleting table:", error);
    return NextResponse.json(
      { success: false, message: "خطا در حذف میز" },
      { status: 500 }
    );
  }
}
