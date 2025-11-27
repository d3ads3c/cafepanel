import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// DELETE - Remove item from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const favoriteId = params.id;

    // Validate id
    if (!favoriteId) {
      return NextResponse.json(
        { success: false, message: 'شناسه الزامی است' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();

    // Check if favorite exists
    const checkQuery = `
      SELECT id FROM favorites 
      WHERE id = ?
    `;

    const [existingRows] = await connection.execute(checkQuery, [favoriteId]);

    if ((existingRows as any[]).length === 0) {
      connection.release();
      return NextResponse.json(
        { success: false, message: 'آیتم پیدا نشد' },
        { status: 404 }
      );
    }

    // Delete favorite
    const deleteQuery = `
      DELETE FROM favorites 
      WHERE id = ?
    `;

    await connection.execute(deleteQuery, [favoriteId]);
    connection.release();

    console.log('Favorite removed:', { id: favoriteId });

    return NextResponse.json({
      success: true,
      message: 'آیتم از پرفروش‌ترین حذف شد'
    });

  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در حذف آیتم' },
      { status: 500 }
    );
  }
}
