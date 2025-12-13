import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB, executeTransactionOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

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

    const bankAccounts = await executeQueryOnUserDB(dbName, async (connection) => {
      const selectQuery = `
        SELECT 
          id, title, bank_name, holder, account_number, created_at, updated_at
        FROM bank_accounts
        ORDER BY created_at DESC
      `;
      const [rows] = await connection.execute(selectQuery);
      return rows as any[];
    });

    return NextResponse.json({ success: true, data: bankAccounts });
  } catch (error: any) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت حساب‌های بانکی', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    if (!body.title || !body.bank_name || !body.holder || !body.account_number) {
      return NextResponse.json(
        { success: false, message: 'تمام فیلدها الزامی هستند' },
        { status: 400 }
      );
    }

    // Validate account number is 16 digits
    const accountNumber = body.account_number.replace(/\s/g, '');
    if (accountNumber.length !== 16 || !/^\d+$/.test(accountNumber)) {
      return NextResponse.json(
        { success: false, message: 'شماره حساب باید 16 رقم باشد' },
        { status: 400 }
      );
    }

    const result = await executeTransactionOnUserDB(dbName, async (connection) => {
      const insertQuery = `
        INSERT INTO bank_accounts 
        (title, bank_name, holder, account_number)
        VALUES (?, ?, ?, ?)
      `;
      const values = [
        body.title,
        body.bank_name,
        body.holder,
        accountNumber
      ];
      const [insertResult] = await connection.execute(insertQuery, values);
      const accountId = (insertResult as any).insertId;
      const [accountRows] = await connection.execute('SELECT * FROM bank_accounts WHERE id = ?', [accountId]);
      return (accountRows as any[])[0];
    });

    return NextResponse.json(
      { success: true, message: 'حساب بانکی با موفقیت ثبت شد', data: result },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating bank account:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در ثبت حساب بانکی', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: 500 }
    );
  }
}

