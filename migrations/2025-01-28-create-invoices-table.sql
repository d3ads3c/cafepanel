-- Create invoices table for accounting system
-- This table stores invoice information with support for discount and tax as percentage or amount

CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(255) NOT NULL,
  invoice_type ENUM('sell', 'buy') NOT NULL,
  contact_id INT,
  contact_name VARCHAR(255) NOT NULL,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  discount_type ENUM('percent', 'amount') DEFAULT 'amount',
  discount_value DECIMAL(15, 2) DEFAULT 0,
  tax_type ENUM('percent', 'amount') DEFAULT 'amount',
  tax_value DECIMAL(15, 2) DEFAULT 0,
  final_amount DECIMAL(15, 2) NOT NULL,
  payment_status ENUM('pending', 'partial', 'paid', 'cancelled') DEFAULT 'pending',
  invoice_date DATE NOT NULL,
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_invoice_number (invoice_number),
  INDEX idx_invoice_type (invoice_type),
  INDEX idx_contact_id (contact_id),
  INDEX idx_invoice_date (invoice_date),
  INDEX idx_payment_status (payment_status),
  FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

