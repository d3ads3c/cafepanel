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

    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/accounting\/bank-accounts\/([^/]+)(?:\/)?$/);
    const accountId = match?.[1];

    const bankAccount = await executeQueryOnUserDB(dbName, async (connection) => {
      const selectQuery = `
        SELECT 
          id, title, bank_name, holder, account_number, created_at, updated_at
        FROM bank_accounts
        WHERE id = ?
      `;
      const [rows] = await connection.execute(selectQuery, [accountId]);
      if ((rows as any[]).length === 0) {
        throw { status: 404, message: 'حساب بانکی یافت نشد' };
      }
      return (rows as any[])[0];
    });

    return NextResponse.json({ success: true, data: bankAccount });
  } catch (error: any) {
    console.error('Error fetching bank account:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در دریافت حساب بانکی', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: error.status || 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
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

    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/accounting\/bank-accounts\/([^/]+)(?:\/)?$/);
    const accountId = match?.[1];
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
      const updateQuery = `
        UPDATE bank_accounts 
        SET title = ?, bank_name = ?, holder = ?, account_number = ?
        WHERE id = ?
      `;
      const values = [body.title, body.bank_name, body.holder, accountNumber, accountId];
      const [updateResult] = await connection.execute(updateQuery, values);
      if ((updateResult as any).affectedRows === 0) {
        throw { status: 404, message: 'حساب بانکی یافت نشد' };
      }
      const [accountRows] = await connection.execute('SELECT * FROM bank_accounts WHERE id = ?', [accountId]);
      return (accountRows as any[])[0];
    });

    return NextResponse.json(
      { success: true, message: 'حساب بانکی با موفقیت به‌روزرسانی شد', data: result },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating bank account:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در به‌روزرسانی حساب بانکی', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    const pathname = new URL(request.url).pathname;
    const match = pathname.match(/\/api\/accounting\/bank-accounts\/([^/]+)(?:\/)?$/);
    const accountId = match?.[1];

    await executeTransactionOnUserDB(dbName, async (connection) => {
      const [deleteResult] = await connection.execute('DELETE FROM bank_accounts WHERE id = ?', [accountId]);
      if ((deleteResult as any).affectedRows === 0) {
        throw { status: 404, message: 'حساب بانکی یافت نشد' };
      }
    });

    return NextResponse.json(
      { success: true, message: 'حساب بانکی با موفقیت حذف شد' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting bank account:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'خطا در حذف حساب بانکی', error: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: error.status || 500 }
    );
  }
}

