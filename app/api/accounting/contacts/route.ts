import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB, executeTransactionOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// GET - Fetch all contacts
export async function GET(request: NextRequest) {
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

    const contacts = await executeQueryOnUserDB(dbName, async (connection) => {
      const selectQuery = `
        SELECT 
          id,
          name,
          phone,
          email,
          address,
          contact_type,
          tax_id,
          notes,
          created_at,
          updated_at
        FROM contacts
        ORDER BY name ASC
      `;
      
      const [rows] = await connection.execute(selectQuery);
      return rows as any[];
    });

    return NextResponse.json({
      success: true,
      data: contacts
    });

  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false, 
        message: 'خطا در دریافت مخاطبین',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create new contact
export async function POST(request: NextRequest) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // Validate required fields
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
      // Insert contact
      const insertQuery = `
        INSERT INTO contacts 
        (name, phone, email, address, contact_type, tax_id, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        body.name,
        body.phone || null,
        body.email || null,
        body.address || null,
        body.contact_type || 'other',
        body.tax_id || null,
        body.notes || null
      ];

      const [insertResult] = await connection.execute(insertQuery, values);
      const contactId = (insertResult as any).insertId;

      // Fetch the created contact
      const [contactRows] = await connection.execute(
        'SELECT * FROM contacts WHERE id = ?',
        [contactId]
      );

      return (contactRows as any[])[0];
    });

    return NextResponse.json({
      success: true,
      message: 'مخاطب با موفقیت ثبت شد',
      data: result
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating contact:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    return NextResponse.json(
      { 
        success: false,
        message: error.message || 'خطا در ثبت مخاطب',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

