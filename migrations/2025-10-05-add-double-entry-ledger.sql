-- Accounts chart
CREATE TABLE IF NOT EXISTS accounting_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  type ENUM('asset','liability','equity','revenue','expense') NOT NULL,
  parent_id INT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES accounting_accounts(id) ON DELETE SET NULL
);

-- Journal entries (headers)
CREATE TABLE IF NOT EXISTS accounting_journal_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entry_date DATE NOT NULL,
  reference VARCHAR(64) NULL,
  description VARCHAR(500) NULL,
  created_by INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Journal lines (debits/credits)
CREATE TABLE IF NOT EXISTS accounting_journal_lines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  journal_entry_id INT NOT NULL,
  account_id INT NOT NULL,
  debit DECIMAL(16,2) NOT NULL DEFAULT 0,
  credit DECIMAL(16,2) NOT NULL DEFAULT 0,
  line_description VARCHAR(500) NULL,
  FOREIGN KEY (journal_entry_id) REFERENCES accounting_journal_entries(id) ON DELETE CASCADE,
  FOREIGN KEY (account_id) REFERENCES accounting_accounts(id)
);

-- Bank/cash accounts registry
CREATE TABLE IF NOT EXISTS accounting_bank_accounts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  holder_name VARCHAR(255) NULL,
  iban VARCHAR(64) NULL,
  card_number VARCHAR(32) NULL,
  account_no VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Payments linked to invoices and bank accounts
CREATE TABLE IF NOT EXISTS accounting_payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NULL,
  amount DECIMAL(16,2) NOT NULL,
  payment_method VARCHAR(50) NULL,
  payment_date DATE NULL,
  description VARCHAR(500) NULL,
  bank_account_id INT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_account_id) REFERENCES accounting_bank_accounts(id) ON DELETE SET NULL
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_accounting_journal_entries_date ON accounting_journal_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_accounting_journal_lines_account ON accounting_journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_accounting_payments_invoice ON accounting_payments(invoice_id);



