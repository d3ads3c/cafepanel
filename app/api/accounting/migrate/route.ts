import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getAuth } from '@/lib/auth';
import { hasPermission } from '@/lib/permissions';

export async function POST(request: NextRequest) {
  const auth = await getAuth();
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    
    // Create accounting tables
    const migrationStatements = [
      `CREATE TABLE IF NOT EXISTS accounting_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(255) NOT NULL,
        type ENUM('asset','liability','equity','revenue','expense') NOT NULL,
        parent_id INT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES accounting_accounts(id) ON DELETE SET NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS accounting_journal_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entry_date DATE NOT NULL,
        reference VARCHAR(64) NULL,
        description VARCHAR(500) NULL,
        created_by INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS accounting_journal_lines (
        id INT AUTO_INCREMENT PRIMARY KEY,
        journal_entry_id INT NOT NULL,
        account_id INT NOT NULL,
        debit DECIMAL(16,2) NOT NULL DEFAULT 0,
        credit DECIMAL(16,2) NOT NULL DEFAULT 0,
        line_description VARCHAR(500) NULL,
        FOREIGN KEY (journal_entry_id) REFERENCES accounting_journal_entries(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounting_accounts(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS accounting_bank_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        holder_name VARCHAR(255) NULL,
        iban VARCHAR(64) NULL,
        card_number VARCHAR(32) NULL,
        account_no VARCHAR(64) NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS accounting_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NULL,
        amount DECIMAL(16,2) NOT NULL,
        payment_method VARCHAR(50) NULL,
        payment_date DATE NULL,
        description VARCHAR(500) NULL,
        bank_account_id INT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (bank_account_id) REFERENCES accounting_bank_accounts(id) ON DELETE SET NULL
      )`
    ];
    
    const results = [];
    for (const statement of migrationStatements) {
      try {
        await connection.execute(statement);
        results.push({ success: true, statement: statement.substring(0, 50) + '...' });
      } catch (error) {
        results.push({ 
          success: false, 
          statement: statement.substring(0, 50) + '...',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Create indexes
    const indexStatements = [
      'CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_date ON accounting_journal_entries(entry_date)',
      'CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_account ON accounting_journal_lines(account_id)',
      'CREATE INDEX IF NOT EXISTS idx_accounting_payments_invoice ON accounting_payments(invoice_id)'
    ];
    
    for (const statement of indexStatements) {
      try {
        await connection.execute(statement);
        results.push({ success: true, statement: statement.substring(0, 50) + '...' });
      } catch (error) {
        results.push({ 
          success: false, 
          statement: statement.substring(0, 50) + '...',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const totalCount = results.length;
    
    return NextResponse.json({
      success: successCount === totalCount,
      message: `Migration completed: ${successCount}/${totalCount} statements successful`,
      results
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
