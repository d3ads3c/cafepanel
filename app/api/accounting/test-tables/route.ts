import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // Check if accounting tables exist
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME LIKE 'accounting_%'
    `);
    
    const existingTables = (tables as any[]).map((table: any) => table.TABLE_NAME);
    
    // Check if we can access the tables
    const tableChecks = {
      accounting_accounts: false,
      accounting_journal_entries: false,
      accounting_journal_lines: false,
      accounting_payments: false,
      accounting_bank_accounts: false
    };
    
    for (const tableName of Object.keys(tableChecks)) {
      try {
        await connection.execute(`SELECT 1 FROM ${tableName} LIMIT 1`);
        tableChecks[tableName as keyof typeof tableChecks] = true;
      } catch (error) {
        console.log(`Table ${tableName} does not exist or is not accessible`);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        existingTables,
        tableChecks,
        message: 'Database connection successful'
      }
    });
    
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
