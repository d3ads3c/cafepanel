-- Create accounting journals table
-- This table stores accounting journal entries with debit and credit amounts

CREATE TABLE IF NOT EXISTS journals (
  id INT AUTO_INCREMENT PRIMARY KEY,
  journal_number VARCHAR(255) NOT NULL UNIQUE,
  journal_date DATE NOT NULL,
  description TEXT,
  reference_type VARCHAR(50), -- 'invoice', 'order', 'manual', etc.
  reference_id INT, -- ID of related invoice, order, etc.
  total_debit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_credit DECIMAL(15, 2) NOT NULL DEFAULT 0,
  status ENUM('draft', 'posted', 'cancelled') DEFAULT 'draft',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_by INT,
  INDEX idx_journal_number (journal_number),
  INDEX idx_journal_date (journal_date),
  INDEX idx_reference (reference_type, reference_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create journal entries table (debit/credit lines)
CREATE TABLE IF NOT EXISTS journal_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  journal_id INT NOT NULL,
  account_code VARCHAR(50) NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  description TEXT,
  debit_amount DECIMAL(15, 2) DEFAULT 0,
  credit_amount DECIMAL(15, 2) DEFAULT 0,
  entry_order INT DEFAULT 0, -- Order of entries in the journal
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_journal_id (journal_id),
  INDEX idx_account_code (account_code),
  FOREIGN KEY (journal_id) REFERENCES journals(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create invoice_orders table to track merged orders
CREATE TABLE IF NOT EXISTS invoice_orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  order_id INT NOT NULL,
  order_total DECIMAL(15, 2) NOT NULL,
  merged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_invoice_id (invoice_id),
  INDEX idx_order_id (order_id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  UNIQUE KEY unique_invoice_order (invoice_id, order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

