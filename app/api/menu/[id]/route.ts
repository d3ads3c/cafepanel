import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';

// GET - Fetch single menu item
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = params.id;
    
    const connection = await pool.getConnection();
    
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
      WHERE m.menu_ID = ? AND m.menu_status = 1
    `;
    
    const [rows] = await connection.execute(selectQuery, [itemId]);
    connection.release();

    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { 
          success: false,
          message: 'آیتم مورد نظر یافت نشد' 
        },
        { status: 404 }
      );
    }

    const item = (rows as any[])[0];
    const menuItem = {
      id: item.menu_ID,
      name: item.menu_name,
      info: item.menu_info,
      price: item.menu_price,
      image: item.menu_img,
      categoryId: item.menu_category,
      categoryName: item.category_name,
      status: item.menu_status
    };

    return NextResponse.json({
      success: true,
      data: menuItem
    });

  } catch (error) {
    console.error('Error fetching menu item:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'خطا در دریافت اطلاعات آیتم' 
      },
      { status: 500 }
    );
  }
}

// PUT - Update menu item
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = params.id;
    const body = await request.json();
    
    // Validate required fields
    if (!body.name || !body.price || !body.info) {
      return NextResponse.json(
        { message: 'نام، قیمت و توضیحات الزامی هستند' },
        { status: 400 }
      );
    }

    // Validate price is a positive number
    if (typeof body.price !== 'number' || body.price <= 0) {
      return NextResponse.json(
        { message: 'قیمت باید عدد مثبت باشد' },
        { status: 400 }
      );
    }

    let imagePath = null;

    // Handle image if provided and different from original
    if (body.image) {
      try {
        // Extract base64 data and file extension
        const base64Data = body.image.replace(/^data:image\/[a-z]+;base64,/, '');
        const fileExtension = body.image.match(/^data:image\/([a-z]+);base64/)?.[1] || 'jpg';
        
        // Generate unique filename
        const uniqueId = randomUUID();
        const filename = `item_${uniqueId}.${fileExtension}`;
        
        // Ensure directory exists
        const productDir = path.join(process.cwd(), 'public', 'img', 'product');
        if (!existsSync(productDir)) {
          await mkdir(productDir, { recursive: true });
        }
        
        // Save image to filesystem
        const imageBuffer = Buffer.from(base64Data, 'base64');
        const filePath = path.join(productDir, filename);
        await writeFile(filePath, imageBuffer);
        
        // Set image path for database storage
        imagePath = `/img/product/${filename}`;
        
        console.log('New image saved:', imagePath);
      } catch (imageError) {
        console.error('Error saving image:', imageError);
        return NextResponse.json(
          { message: 'خطا در ذخیره تصویر' },
          { status: 500 }
        );
      }
    }

    // Update data in MariaDB
    try {
      const connection = await pool.getConnection();
      
      let updateQuery: string;
      let values: any[];

      if (imagePath) {
        // Update with new image
        updateQuery = `
          UPDATE menu 
          SET menu_name = ?, menu_info = ?, menu_price = ?, menu_img = ?, menu_category = ?
          WHERE menu_ID = ?
        `;
        values = [body.name, body.info, body.price, imagePath, body.categoryId || null, itemId];
      } else {
        // Update without changing image
        updateQuery = `
          UPDATE menu 
          SET menu_name = ?, menu_info = ?, menu_price = ?, menu_category = ?
          WHERE menu_ID = ?
        `;
        values = [body.name, body.info, body.price, body.categoryId || null, itemId];
      }

      const [result] = await connection.execute(updateQuery, values);
      connection.release();

      if ((result as any).affectedRows === 0) {
        return NextResponse.json(
          { message: 'آیتم مورد نظر یافت نشد' },
          { status: 404 }
        );
      }

      console.log('Menu item updated:', {
        id: itemId,
        name: body.name,
        price: body.price,
        info: body.info,
        image: imagePath
      });

      return NextResponse.json(
        { 
          message: 'آیتم با موفقیت ویرایش شد',
          data: {
            id: itemId,
            name: body.name,
            price: body.price,
            info: body.info,
            image: imagePath
          }
        },
        { status: 200 }
      );

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { message: 'خطا در ذخیره در پایگاه داده' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { message: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete menu item (set status to 0)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const itemId = params.id;
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        `UPDATE menu SET menu_status = 0 WHERE menu_ID = ?`,
        [itemId]
      );
      connection.release();

      if ((result as any).affectedRows === 0) {
        return NextResponse.json(
          { message: 'آیتم مورد نظر یافت نشد' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, message: 'آیتم حذف شد' });
    } catch (dbError) {
      connection.release();
      console.error('Database error:', dbError);
      return NextResponse.json(
        { message: 'خطا در حذف آیتم' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { message: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}