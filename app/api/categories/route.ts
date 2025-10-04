import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

// GET - Fetch all categories
export async function GET(request: NextRequest) {
  try {
    const connection = await pool.getConnection();
    
    const selectQuery = `
      SELECT 
        category_ID,
        category_name
      FROM categories 
      ORDER BY category_name ASC
    `;
    
    const [rows] = await connection.execute(selectQuery);
    connection.release();

    // Format the data for frontend
    const categories = (rows as any[]).map(item => ({
      id: item.category_ID,
      name: item.category_name
    }));

    return NextResponse.json({
      success: true,
      data: categories
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
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
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_categories')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { message: 'نام دسته‌بندی الزامی است' },
        { status: 400 }
      );
    }

    const categoryName = body.name.trim();

    // Check if category already exists
    const connection = await pool.getConnection();
    
    const checkQuery = `
      SELECT category_ID FROM categories 
      WHERE category_name = ?
    `;
    
    const [existingRows] = await connection.execute(checkQuery, [categoryName]);
    
    if ((existingRows as any[]).length > 0) {
      connection.release();
      return NextResponse.json(
        { message: 'دسته‌بندی با این نام قبلاً وجود دارد' },
        { status: 400 }
      );
    }

    // Insert new category
    const insertQuery = `
      INSERT INTO categories 
      (category_name) 
      VALUES (?)
    `;
    
    const [result] = await connection.execute(insertQuery, [categoryName]);
    connection.release();

    console.log('Category created:', {
      id: (result as any).insertId,
      name: categoryName
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

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { message: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}
