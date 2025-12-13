import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB, executeTransactionOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// GET - Get single contact
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_accounting')) {
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

    const contactId = parseInt(params.id);
    if (isNaN(contactId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه مخاطب نامعتبر است' },
        { status: 400 }
      );
    }

    const contact = await executeQueryOnUserDB(dbName, async (connection) => {
      const [rows] = await connection.execute(
        'SELECT * FROM contacts WHERE id = ?',
        [contactId]
      );
      return (rows as any[])[0] || null;
    });

    if (!contact) {
      return NextResponse.json(
        { success: false, message: 'مخاطب یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contact
    });

  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت مخاطب' },
      { status: 500 }
    );
  }
}

// PUT - Update contact
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  try {
    const contactId = parseInt(params.id);
    if (isNaN(contactId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه مخاطب نامعتبر است' },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    if (!body.name) {
      return NextResponse.json(
        { success: false, message: 'نام مخاطب الزامی است' },
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

    const result = await executeTransactionOnUserDB(dbName, async (connection) => {
      // Check if contact exists
      const [existingRows] = await connection.execute(
        'SELECT id FROM contacts WHERE id = ?',
        [contactId]
      );

      if ((existingRows as any[]).length === 0) {
        throw { status: 404, message: 'مخاطب یافت نشد' };
      }

      // Update contact
      await connection.execute(
        `UPDATE contacts 
         SET name = ?, phone = ?, email = ?, address = ?, contact_type = ?, tax_id = ?, notes = ?
         WHERE id = ?`,
        [
          body.name,
          body.phone || null,
          body.email || null,
          body.address || null,
          body.contact_type || 'other',
          body.tax_id || null,
          body.notes || null,
          contactId
        ]
      );

      // Fetch updated contact
      const [contactRows] = await connection.execute(
        'SELECT * FROM contacts WHERE id = ?',
        [contactId]
      );

      return (contactRows as any[])[0];
    });

    return NextResponse.json({
      success: true,
      message: 'مخاطب با موفقیت به‌روزرسانی شد',
      data: result
    });

  } catch (error: any) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'خطا در به‌روزرسانی مخاطب' 
      },
      { status: error.status || 500 }
    );
  }
}

// DELETE - Delete contact
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  try {
    const contactId = parseInt(params.id);
    if (isNaN(contactId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه مخاطب نامعتبر است' },
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

    await executeTransactionOnUserDB(dbName, async (connection) => {
      // Check if contact exists
      const [existingRows] = await connection.execute(
        'SELECT id FROM contacts WHERE id = ?',
        [contactId]
      );

      if ((existingRows as any[]).length === 0) {
        throw { status: 404, message: 'مخاطب یافت نشد' };
      }

      // Delete contact
      await connection.execute(
        'DELETE FROM contacts WHERE id = ?',
        [contactId]
      );
    });

    return NextResponse.json({
      success: true,
      message: 'مخاطب با موفقیت حذف شد'
    });

  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'خطا در حذف مخاطب' 
      },
      { status: error.status || 500 }
    );
  }
}

