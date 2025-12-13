import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB } from '@/lib/dbHelper';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// GET - Fetch all favorite menu items
export async function GET(request: NextRequest) {
  try {
    const dbName = await getUserDatabaseFromRequest(request);
    if (!dbName) {
      return NextResponse.json(
        { success: false, message: 'Unable to determine user database' },
        { status: 401 }
      );
    }

    const favorites = await executeQueryOnUserDB(dbName, async (connection) => {
      const selectQuery = `
        SELECT 
          f.id,
          f.menu_ID,
          m.menu_name as name,
          m.menu_price as price,
          m.menu_img as image,
          m.menu_category as categoryId
        FROM favorites f
        INNER JOIN menu m ON f.menu_ID = m.menu_ID
        ORDER BY f.created_at DESC
      `;
      
      const [rows] = await connection.execute(selectQuery);

      // Format the data for frontend
      return (rows as any[]).map(item => ({
        id: item.menu_ID,
        name: item.name,
        price: item.price.toString(),
        image: item.image,
        categoryId: item.categoryId,
        favoriteId: item.id
      }));
    });

    return NextResponse.json({
      success: true,
      data: favorites
    });

  } catch (error) {
    console.error('Error fetching favorites');
    return NextResponse.json(
      { 
        success: false,
        message: 'خطا در دریافت آیتم‌های پرفروش‌ترین' 
      },
      { status: 500 }
    );
  }
}

// POST - Add item to favorites
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.menuId) {
      return NextResponse.json(
        { success: false, message: 'menu_ID الزامی است' },
        { status: 400 }
      );
    }

    const dbName = await getUserDatabaseFromRequest(request);
    if (!dbName) {
      return NextResponse.json(
        { success: false, message: 'Unable to determine user database' },
        { status: 401 }
      );
    }

    const result = await executeQueryOnUserDB(dbName, async (connection) => {
      // Check if item already exists in favorites
      const checkQuery = `
        SELECT id FROM favorites 
        WHERE menu_ID = ?
      `;
      
      const [existingRows] = await connection.execute(checkQuery, [body.menuId]);
      
      if ((existingRows as any[]).length > 0) {
        throw { status: 400, message: 'این آیتم قبلاً به پرفروش‌ترین اضافه شده است' };
      }

      // Insert new favorite
      const insertQuery = `
        INSERT INTO favorites 
        (menu_ID) 
        VALUES (?)
      `;
      
      const [insertResult] = await connection.execute(insertQuery, [body.menuId]);
      return insertResult;
    });

    return NextResponse.json(
      { 
        success: true,
        message: 'آیتم به پرفروش‌ترین اضافه شد',
        data: {
          favoriteId: (result as any).insertId,
          menuId: body.menuId
        }
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error adding favorite');
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در پردازش درخواست' },
      { status: error.status || 500 }
    );
  }
}
