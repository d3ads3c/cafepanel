import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB, executeTransactionOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

// GET - Fetch all journals
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

    const journals = await executeQueryOnUserDB(dbName, async (connection) => {
      const selectQuery = `
        SELECT 
          j.*,
          COUNT(je.id) as entry_count
        FROM journals j
        LEFT JOIN journal_entries je ON j.id = je.journal_id
        GROUP BY j.id
        ORDER BY j.journal_date DESC, j.created_at DESC
      `;

      const [rows] = await connection.execute(selectQuery);
      return rows as any[];
    });

    return NextResponse.json({
      success: true,
      data: journals
    });

  } catch (error: any) {
    console.error('Error fetching journals:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در دریافت دفتر روزنامه',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST - Create new journal
export async function POST(request: NextRequest) {
  const auth = await getEnhancedAuth(request);
  
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();

    // Validate required fields
    if (!body.journal_number || !body.journal_date || !body.entries || !Array.isArray(body.entries)) {
      return NextResponse.json(
        { success: false, message: 'فیلدهای الزامی را پر کنید' },
        { status: 400 }
      );
    }

    // Validate entries
    if (body.entries.length < 2) {
      return NextResponse.json(
        { success: false, message: 'حداقل دو سطر برای ثبت دفتر روزنامه لازم است' },
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
      // Check for duplicate journal number
      const [duplicateCheck] = await connection.execute(
        'SELECT id FROM journals WHERE journal_number = ?',
        [body.journal_number]
      );

      if (Array.isArray(duplicateCheck) && duplicateCheck.length > 0) {
        throw { status: 400, message: 'شماره دفتر روزنامه تکراری است' };
      }

      // Insert journal
      const insertJournalQuery = `
        INSERT INTO journals
        (journal_number, journal_date, description, reference_type, reference_id, total_debit, total_credit, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const journalValues = [
        body.journal_number,
        body.journal_date,
        body.description || null,
        body.reference_type || null,
        body.reference_id || null,
        totalDebit,
        totalCredit,
        body.status || 'draft'
      ];

      const [journalResult] = await connection.execute(insertJournalQuery, journalValues);
      const journalId = (journalResult as any).insertId;

      // Insert journal entries
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

      // Fetch the created journal with entries
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
      message: 'دفتر روزنامه با موفقیت ثبت شد',
      data: result
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating journal:', error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'خطا در ثبت دفتر روزنامه',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: error.status || 500 }
    );
  }
}

