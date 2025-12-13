import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { executeQueryOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// GET - Fetch single menu item
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
    const match = pathname.match(/\/api\/menu\/([^/]+)(?:\/)?$/);
    const itemId = match?.[1];
    
    const menuItem = await executeQueryOnUserDB(dbName, async (connection) => {
      const selectQuery = `
        SELECT 
          m.menu_ID,
          m.menu_name,
          m.menu_info,
          m.menu_price,
          m.menu_img,
          m.menu_category,
          m.menu_status,
          m.menu_show,
          c.category_name
        FROM menu m
        LEFT JOIN categories c ON m.menu_category = c.category_ID
        WHERE m.menu_ID = ? AND m.menu_status = 1
      `;
      
      const [rows] = await connection.execute(selectQuery, [itemId]);

      if ((rows as any[]).length === 0) {
        throw { status: 404, message: 'آیتم مورد نظر یافت نشد' };
      }

      const item = (rows as any[])[0];
      return {
        id: Number(item.menu_ID),
        name: item.menu_name ?? '',
        info: item.menu_info ?? '',
        price: Number(item.menu_price),
        image: item.menu_img ?? null,
        categoryId: item.menu_category === null || item.menu_category === undefined ? null : Number(item.menu_category),
        categoryName: item.category_name ?? null,
        status: Number(item.menu_status),
        menu_show: item.menu_show !== undefined && item.menu_show !== null ? Number(item.menu_show) : 1
      };
    });

    return NextResponse.json({
      success: true,
      data: menuItem
    });

  } catch (error) {
    console.error('Error fetching menu item');
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
  request: NextRequest
) {
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

    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/menu\/([^/]+)(?:\/)?$/);
    const itemId = match?.[1];
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
        
      } catch (imageError) {
        console.error('Error saving image:', imageError);
        return NextResponse.json(
          { message: 'خطا در ذخیره تصویر' },
          { status: 500 }
        );
      }
    }

    // Update data in MariaDB
    await executeQueryOnUserDB(dbName, async (connection) => {
      let updateQuery: string;
      let values: any[];

      const menuShow = body.menu_show !== undefined ? body.menu_show : 1;

      if (imagePath) {
        // Update with new image
        updateQuery = `
          UPDATE menu 
          SET menu_name = ?, menu_info = ?, menu_price = ?, menu_img = ?, menu_category = ?, menu_show = ?
          WHERE menu_ID = ?
        `;
        values = [body.name, body.info, body.price, imagePath, body.categoryId || null, menuShow, itemId];
      } else {
        // Update without changing image
        updateQuery = `
          UPDATE menu 
          SET menu_name = ?, menu_info = ?, menu_price = ?, menu_category = ?, menu_show = ?
          WHERE menu_ID = ?
        `;
        values = [body.name, body.info, body.price, body.categoryId || null, menuShow, itemId];
      }

      const [result] = await connection.execute(updateQuery, values);

      if ((result as any).affectedRows === 0) {
        throw { status: 404, message: 'آیتم مورد نظر یافت نشد' };
      }
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

  } catch (error: any) {
    console.error('Error updating menu item:', error);
    return NextResponse.json(
      { message: error.message || 'خطا در پردازش درخواست' },
      { status: error.status || 500 }
    );
  }
}

// DELETE - Soft delete menu item (set status to 0)
export async function DELETE(
  request: NextRequest
) {
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

    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/menu\/([^/]+)(?:\/)?$/);
    const itemId = match?.[1];

    await executeQueryOnUserDB(dbName, async (connection) => {
      const [result] = await connection.execute(
        `UPDATE menu SET menu_status = 0 WHERE menu_ID = ?`,
        [itemId]
      );

      if ((result as any).affectedRows === 0) {
        throw { status: 404, message: 'آیتم مورد نظر یافت نشد' };
      }
    });

    return NextResponse.json({ success: true, message: 'آیتم حذف شد' });
  } catch (error: any) {
    console.error('Error deleting menu item:', error);
    return NextResponse.json(
      { message: error.message || 'خطا در پردازش درخواست' },
      { status: error.status || 500 }
    );
  }
}