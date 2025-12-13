import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB, executeTransactionOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// GET - Get single journal with entries
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const journalId = parseInt(id);
    if (isNaN(journalId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه دفتر روزنامه نامعتبر است' },
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

    const journal = await executeQueryOnUserDB(dbName, async (connection) => {
      const [journalRows] = await connection.execute(
        'SELECT * FROM journals WHERE id = ?',
        [journalId]
      );

      if ((journalRows as any[]).length === 0) {
        return null;
      }

      const [entryRows] = await connection.execute(
        'SELECT * FROM journal_entries WHERE journal_id = ? ORDER BY entry_order ASC',
        [journalId]
      );

      return {
        ...(journalRows as any[])[0],
        entries: entryRows as any[]
      };
    });

    if (!journal) {
      return NextResponse.json(
        { success: false, message: 'دفتر روزنامه یافت نشد' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: journal
    });

  } catch (error) {
    console.error('Error fetching journal:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت دفتر روزنامه' },
      { status: 500 }
    );
  }
}

// PUT - Update journal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const journalId = parseInt(id);
    if (isNaN(journalId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه دفتر روزنامه نامعتبر است' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.journal_number || !body.journal_date || !body.entries || !Array.isArray(body.entries)) {
      return NextResponse.json(
        { success: false, message: 'فیلدهای الزامی را پر کنید' },
        { status: 400 }
      );
    }

    // Validate debit = credit
    const totalDebit = body.entries.reduce((sum: number, entry: any) => sum + (parseFloat(entry.debit_amount) || 0), 0);
    const totalCredit = body.entries.reduce((sum: number, entry: any) => sum + (parseFloat(entry.credit_amount) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json(
        { success: false, message: 'جمع بدهکار باید برابر جمع بستانکار باشد' },
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
      // Check for duplicate journal number (excluding current)
      const [duplicateCheck] = await connection.execute(
        'SELECT id FROM journals WHERE journal_number = ? AND id != ?',
        [body.journal_number, journalId]
      );

      if (Array.isArray(duplicateCheck) && duplicateCheck.length > 0) {
        throw { status: 400, message: 'شماره دفتر روزنامه تکراری است' };
      }

      // Check if journal exists
      const [existingRows] = await connection.execute(
        'SELECT id FROM journals WHERE id = ?',
        [journalId]
      );

      if ((existingRows as any[]).length === 0) {
        throw { status: 404, message: 'دفتر روزنامه یافت نشد' };
      }

      // Update journal
      const updateJournalQuery = `
        UPDATE journals 
        SET journal_number = ?, journal_date = ?, description = ?, reference_type = ?, reference_id = ?,
            total_debit = ?, total_credit = ?, status = ?
        WHERE id = ?
      `;

      await connection.execute(updateJournalQuery, [
        body.journal_number,
        body.journal_date,
        body.description || null,
        body.reference_type || null,
        body.reference_id || null,
        totalDebit,
        totalCredit,
        body.status || 'draft',
        journalId
      ]);

      // Delete existing entries
      await connection.execute(
        'DELETE FROM journal_entries WHERE journal_id = ?',
        [journalId]
      );

      // Insert new entries
      const insertEntryQuery = `
        INSERT INTO journal_entries
        (journal_id, account_code, account_name, description, debit_amount, credit_amount, entry_order)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      for (let i = 0; i < body.entries.length; i++) {
        const entry = body.entries[i];
        await connection.execute(insertEntryQuery, [
          journalId,
          entry.account_code,
          entry.account_name,
          entry.description || null,
          parseFloat(entry.debit_amount) || 0,
          parseFloat(entry.credit_amount) || 0,
          i + 1
        ]);
      }

      // Fetch updated journal
      const [journalRows] = await connection.execute(
        'SELECT * FROM journals WHERE id = ?',
        [journalId]
      );

      const [entryRows] = await connection.execute(
        'SELECT * FROM journal_entries WHERE journal_id = ? ORDER BY entry_order ASC',
        [journalId]
      );

      return {
        ...(journalRows as any[])[0],
        entries: entryRows as any[]
      };
    });

    return NextResponse.json({
      success: true,
      message: 'دفتر روزنامه با موفقیت به‌روزرسانی شد',
      data: result
    });

  } catch (error: any) {
    console.error('Error updating journal:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'خطا در به‌روزرسانی دفتر روزنامه',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: error.status || 500 }
    );
  }
}

// DELETE - Delete journal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  try {
    const { id } = await params;
    const journalId = parseInt(id);
    if (isNaN(journalId)) {
      return NextResponse.json(
        { success: false, message: 'شناسه دفتر روزنامه نامعتبر است' },
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
      // Check if journal exists
      const [existingRows] = await connection.execute(
        'SELECT id FROM journals WHERE id = ?',
        [journalId]
      );

      if ((existingRows as any[]).length === 0) {
        throw { status: 404, message: 'دفتر روزنامه یافت نشد' };
      }

      // Delete journal (entries will be deleted by CASCADE)
      await connection.execute(
        'DELETE FROM journals WHERE id = ?',
        [journalId]
      );
    });

    return NextResponse.json({
      success: true,
      message: 'دفتر روزنامه با موفقیت حذف شد'
    });

  } catch (error: any) {
    console.error('Error deleting journal:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'خطا در حذف دفتر روزنامه',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: error.status || 500 }
    );
  }
}

