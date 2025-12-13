import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB } from '@/lib/dbHelper';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// DELETE - Remove item from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const dbName = await getUserDatabaseFromRequest(request);
    if (!dbName) {
      return NextResponse.json(
        { success: false, message: 'Unable to determine user database' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const favoriteId = id;

    // Validate id
    if (!favoriteId) {
      return NextResponse.json(
        { success: false, message: 'شناسه الزامی است' },
        { status: 400 }
      );
    }

    await executeQueryOnUserDB(dbName, async (connection) => {
      // Check if favorite exists
      const checkQuery = `
        SELECT id FROM favorites 
        WHERE id = ?
      `;

      const [existingRows] = await connection.execute(checkQuery, [favoriteId]);

      if ((existingRows as any[]).length === 0) {
        throw { status: 404, message: 'آیتم پیدا نشد' };
      }

      // Delete favorite
      const deleteQuery = `
        DELETE FROM favorites 
        WHERE id = ?
      `;

      await connection.execute(deleteQuery, [favoriteId]);
    });

    return NextResponse.json({
      success: true,
      message: 'آیتم از پرفروش‌ترین حذف شد'
    });

  } catch (error) {
    console.error('Error deleting favorite');
    return NextResponse.json(
      { success: false, message: 'خطا در حذف آیتم' },
      { status: 500 }
    );
  }
}
