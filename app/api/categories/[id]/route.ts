import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// GET - Fetch single category
export async function GET(
  request: NextRequest
) {
  try {
    const dbName = await getUserDatabaseFromRequest(request);
    if (!dbName) {
      return NextResponse.json(
        { success: false, message: 'Unable to determine user database' },
        { status: 401 }
      );
    }

    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/categories\/([^/]+)(?:\/)?$/);
    const categoryId = match?.[1];
    
    const category = await executeQueryOnUserDB(dbName, async (connection) => {
      const selectQuery = `
        SELECT 
          category_ID,
          category_name
        FROM categories 
        WHERE category_ID = ?
      `;
      
      const [rows] = await connection.execute(selectQuery, [categoryId]);

      if ((rows as any[]).length === 0) {
        throw { status: 404, message: 'دسته‌بندی مورد نظر یافت نشد' };
      }

      const item = (rows as any[])[0];
      return {
        id: item.category_ID,
        name: item.category_name
      };
    });

    return NextResponse.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Error fetching category');
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
  request: NextRequest
) {
  const auth = await getEnhancedAuth(request);
  if (!hasPermission(auth, 'manage_categories')) {
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

    const result = await executeQueryOnUserDB(dbName, async (connection) => {
      // Check if category name already exists (excluding current category)
      const checkQuery = `
        SELECT category_ID FROM categories 
        WHERE category_name = ? AND category_ID != ?
      `;
      
      const [existingRows] = await connection.execute(checkQuery, [categoryName, categoryId]);
      
      if ((existingRows as any[]).length > 0) {
        throw { status: 400, message: 'دسته‌بندی با این نام قبلاً وجود دارد' };
      }

      // Update category
      const updateQuery = `
        UPDATE categories 
        SET category_name = ?
        WHERE category_ID = ?
      `;
      
      const [updateResult] = await connection.execute(updateQuery, [categoryName, categoryId]);

      if ((updateResult as any).affectedRows === 0) {
        throw { status: 404, message: 'دسته‌بندی مورد نظر یافت نشد' };
      }

      return updateResult;
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
    console.error('Error updating category');
    return NextResponse.json(
      { message: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest
) {
  const auth = await getEnhancedAuth(request);
  if (!hasPermission(auth, 'manage_categories')) {
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
    const match = pathname.match(/\/api\/categories\/([^/]+)(?:\/)?$/);
    const categoryId = match?.[1];
    
    const result = await executeQueryOnUserDB(dbName, async (connection) => {
      // Check if category exists
      const checkQuery = `
        SELECT category_ID FROM categories 
        WHERE category_ID = ?
      `;
      
      const [existingRows] = await connection.execute(checkQuery, [categoryId]);
      
      if ((existingRows as any[]).length === 0) {
        throw { status: 404, message: 'دسته‌بندی مورد نظر یافت نشد' };
      }

      // Check if category is being used in menu items
      const checkUsageQuery = `
        SELECT COUNT(*) as count FROM menu 
        WHERE menu_category = ?
      `;
      
      const [usageRows] = await connection.execute(checkUsageQuery, [categoryId]);
      const usageCount = (usageRows as any[])[0].count;
      
      if (usageCount > 0) {
        throw { status: 400, message: `این دسته‌بندی در ${usageCount} آیتم منو استفاده شده و قابل حذف نیست` };
      }

      // Delete category
      const deleteQuery = `
        DELETE FROM categories 
        WHERE category_ID = ?
      `;
      
      const [deleteResult] = await connection.execute(deleteQuery, [categoryId]);
      return deleteResult;
    });

    return NextResponse.json(
      { 
        message: 'دسته‌بندی با موفقیت حذف شد'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting category');
    return NextResponse.json(
      { message: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}
