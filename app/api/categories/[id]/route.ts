import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET - Fetch single category
export async function GET(
  request: Request
) {
  try {
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/categories\/([^/]+)(?:\/)?$/);
    const categoryId = match?.[1];
    
    const connection = await pool.getConnection();
    
    const selectQuery = `
      SELECT 
        category_ID,
        category_name
      FROM categories 
      WHERE category_ID = ?
    `;
    
    const [rows] = await connection.execute(selectQuery, [categoryId]);
    connection.release();

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'دسته‌بندی مورد نظر یافت نشد' 
        },
        { status: 404 }
      );
    }

    const item = (rows as any[])[0];
    const category = {
      id: item.category_ID,
      name: item.category_name
    };

    return NextResponse.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'خطا در دریافت اطلاعات دسته‌بندی' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(
  request: Request
) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_categories')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }
  try {
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/categories\/([^/]+)(?:\/)?$/);
    const categoryId = match?.[1];
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { message: 'نام دسته‌بندی الزامی است' },
        { status: 400 }
      );
    }

    const categoryName = body.name.trim();

    const connection = await pool.getConnection();
    
    // Check if category name already exists (excluding current category)
    const checkQuery = `
      SELECT category_ID FROM categories 
      WHERE category_name = ? AND category_ID != ?
    `;
    
    const [existingRows] = await connection.execute(checkQuery, [categoryName, categoryId]);
    
    if ((existingRows as any[]).length > 0) {
      connection.release();
      return NextResponse.json(
        { message: 'دسته‌بندی با این نام قبلاً وجود دارد' },
        { status: 400 }
      );
    }

    // Update category
    const updateQuery = `
      UPDATE categories 
      SET category_name = ?
      WHERE category_ID = ?
    `;
    
    const [result] = await connection.execute(updateQuery, [categoryName, categoryId]);
    connection.release();

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { message: 'دسته‌بندی مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    console.log('Category updated:', {
      id: categoryId,
      name: categoryName
    });

    return NextResponse.json(
      { 
        message: 'دسته‌بندی با موفقیت ویرایش شد',
        data: {
          id: categoryId,
          name: categoryName
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      { message: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(
  request: Request
) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_categories')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }
  try {
    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/categories\/([^/]+)(?:\/)?$/);
    const categoryId = match?.[1];
    
    const connection = await pool.getConnection();
    
    // Check if category exists
    const checkQuery = `
      SELECT category_ID FROM categories 
      WHERE category_ID = ?
    `;
    
    const [existingRows] = await connection.execute(checkQuery, [categoryId]);
    
    if ((existingRows as any[]).length === 0) {
      connection.release();
      return NextResponse.json(
        { message: 'دسته‌بندی مورد نظر یافت نشد' },
        { status: 404 }
      );
    }

    // Check if category is being used in menu items
    const checkUsageQuery = `
      SELECT COUNT(*) as count FROM menu 
      WHERE menu_category = ?
    `;
    
    const [usageRows] = await connection.execute(checkUsageQuery, [categoryId]);
    const usageCount = (usageRows as any[])[0].count;
    
    if (usageCount > 0) {
      connection.release();
      return NextResponse.json(
        { message: `این دسته‌بندی در ${usageCount} آیتم منو استفاده شده و قابل حذف نیست` },
        { status: 400 }
      );
    }

    // Delete category
    const deleteQuery = `
      DELETE FROM categories 
      WHERE category_ID = ?
    `;
    
    const [result] = await connection.execute(deleteQuery, [categoryId]);
    connection.release();

    console.log('Category deleted:', {
      id: categoryId
    });

    return NextResponse.json(
      { 
        message: 'دسته‌بندی با موفقیت حذف شد'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      { message: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}
