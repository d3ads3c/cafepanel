import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// GET - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const dbName = await getUserDatabaseFromRequest(request);
    if (!dbName) {
      return NextResponse.json(
        { success: false, message: 'Unable to determine user database' },
        { status: 401 }
      );
    }

    const categories = await executeQueryOnUserDB(dbName, async (connection) => {
      const selectQuery = `
        SELECT 
          category_ID,
          category_name
        FROM categories 
        ORDER BY category_name ASC
      `;
      
      const [rows] = await connection.execute(selectQuery);
      
      // Format the data for frontend
      return (rows as any[]).map(item => ({
        id: item.category_ID,
        name: item.category_name
      }));
    });

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories');
    return NextResponse.json(
      { 
        success: false,
        message: 'خطا در دریافت دسته‌بندی ها' 
      },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { message: 'نام دسته‌بندی الزامی است' },
        { status: 400 }
      );
    }

    const categoryName = body.name.trim();

    // Check if category already exists and insert if not
    const result = await executeQueryOnUserDB(dbName, async (connection) => {
      const checkQuery = `
        SELECT category_ID FROM categories 
        WHERE category_name = ?
      `;
      
      const [existingRows] = await connection.execute(checkQuery, [categoryName]);
      
      if ((existingRows as any[]).length > 0) {
        throw new Error('دسته‌بندی با این نام قبلاً وجود دارد');
      }

      // Insert new category
      const insertQuery = `
        INSERT INTO categories 
        (category_name) 
        VALUES (?)
      `;
      
      const [insertResult] = await connection.execute(insertQuery, [categoryName]);
      return insertResult;
    });

    return NextResponse.json(
      { 
        message: 'دسته‌بندی با موفقیت ایجاد شد',
        data: {
          id: (result as any).insertId,
          name: categoryName
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating category:');
    return NextResponse.json(
      { message: error.message || 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}
