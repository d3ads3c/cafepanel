import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
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

    // Handle image if provided
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
        
        console.log('Image saved:', imagePath);
      } catch (imageError) {
        console.error('Error saving image:', imageError);
        return NextResponse.json(
          { message: 'خطا در ذخیره تصویر' },
          { status: 500 }
        );
      }
    }

    // Insert data into MariaDB
    try {
      const connection = await pool.getConnection();
      
      const insertQuery = `
        INSERT INTO menu 
        (menu_name, menu_info, menu_price, menu_img, menu_category, menu_status) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        body.name,
        body.info,
        body.price,
        imagePath || null,
        body.categoryId || null,
        1
      ];

      const [result] = await connection.execute(insertQuery, values);
      connection.release();

      console.log('Menu item saved to database:', {
        id: (result as any).insertId,
        name: body.name,
        price: body.price,
        info: body.info,
        image: imagePath
      });

      return NextResponse.json(
        { 
          message: 'آیتم با موفقیت ثبت شد',
          data: {
            id: (result as any).insertId,
            name: body.name,
            price: body.price,
            info: body.info,
            image: imagePath,
            status: 1
          }
        },
        { status: 201 }
      );

    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { message: 'خطا در ذخیره در پایگاه داده' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { message: 'خطا در پردازش درخواست' },
      { status: 500 }
    );
  }
}
