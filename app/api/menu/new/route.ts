import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { executeQueryOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

export async function POST(request: NextRequest) {
  const auth = await getEnhancedAuth(request);
  if (!hasPermission(auth, 'manage_menu')) {
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
    if (!body.name || !body.price) {
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
        
      } catch (imageError) {
        console.error('Error saving image:', imageError);
        return NextResponse.json(
          { message: 'خطا در ذخیره تصویر' },
          { status: 500 }
        );
      }
    }

    // Insert data into MariaDB
    const result = await executeQueryOnUserDB(dbName, async (connection) => {
      const menuShow = body.menu_show !== undefined ? body.menu_show : 1;
      
      const insertQuery = `
        INSERT INTO menu 
        (menu_name, menu_info, menu_price, menu_img, menu_category, menu_status, menu_show) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        body.name,
        body.info,
        body.price,
        imagePath || null,
        body.categoryId || null,
        1,
        menuShow
      ];

      const [insertResult] = await connection.execute(insertQuery, values);
      return {
        id: (insertResult as any).insertId,
        name: body.name,
        price: body.price,
        info: body.info,
        image: imagePath,
        status: 1
      };
    });

    return NextResponse.json(
      { 
        message: 'آیتم با موفقیت ثبت شد',
        data: result
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('Error creating menu item:', error);
    return NextResponse.json(
      { message: error.message || 'خطا در پردازش درخواست' },
      { status: error.status || 500 }
    );
  }
}
