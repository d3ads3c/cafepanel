import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const selectQuery = `
      SELECT 
        m.menu_ID,
        m.menu_name,
        m.menu_info,
        m.menu_price,
        m.menu_img,
        m.menu_category,
        m.menu_status,
        c.category_name
      FROM menu m
      LEFT JOIN categories c ON m.menu_category = c.category_ID
      WHERE m.menu_status = 1
      ORDER BY m.menu_ID DESC
    `;
    
    const [rows] = await connection.execute(selectQuery);
    connection.release();

    // Format the data for frontend
    const menuItems = (rows as any[]).map(item => ({
      id: Number(item.menu_ID),
      name: item.menu_name ?? '',
      info: item.menu_info ?? '',
      price: Number(item.menu_price),
      image: item.menu_img ?? null,
      categoryId: item.menu_category === null || item.menu_category === undefined ? null : Number(item.menu_category),
      categoryName: item.category_name ?? null,
      status: Number(item.menu_status),
    }));

    return NextResponse.json({
      success: true,
      data: menuItems
    });

  } catch (error) {
    console.error('Error fetching menu items:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'خطا در دریافت آیتم های منو' 
      },
      { status: 500 }
    );
  } finally {
    // Ensure connection is released even if an error occurs
    if (connection) {
      connection.release();
    }
  }
}
