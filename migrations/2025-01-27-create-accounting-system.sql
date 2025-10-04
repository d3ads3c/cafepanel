-- Create accounting system tables
-- Accounting contacts table for customers and suppliers
CREATE TABLE IF NOT EXISTS accounting_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type ENUM('customer', 'supplier') NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Invoices table for both buy and sell invoices
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_number VARCHAR(50) NOT NULL UNIQUE,
  invoice_type ENUM('buy', 'sell') NOT NULL,
  contact_id INT,
  customer_supplier_name VARCHAR(255) NOT NULL,
  customer_supplier_phone VARCHAR(20),
  customer_supplier_address TEXT,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  final_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  payment_method ENUM('cash', 'card', 'bank_transfer', 'credit') NOT NULL DEFAULT 'cash',
  payment_status ENUM('pending', 'paid', 'partial', 'cancelled') NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (contact_id) REFERENCES accounting_contacts(id) ON DELETE SET NULL
);

-- Invoice items table for detailed line items
CREATE TABLE IF NOT EXISTS invoice_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoice_id INT NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  item_description TEXT,
  quantity DECIMAL(10,3) NOT NULL DEFAULT 1.000,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_contacts_type ON accounting_contacts(type);
CREATE INDEX idx_contacts_name ON accounting_contacts(name);
CREATE INDEX idx_invoices_type ON invoices(invoice_type);
CREATE INDEX idx_invoices_date ON invoices(created_at);
CREATE INDEX idx_invoices_customer ON invoices(customer_supplier_name);
CREATE INDEX idx_invoices_contact ON invoices(contact_id);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Insert some sample data (optional)
-- You can remove this section if you don't want sample data
INSERT INTO invoices (invoice_number, invoice_type, customer_supplier_name, total_amount, final_amount, payment_method, payment_status, notes) VALUES
('INV-2025-001', 'sell', 'مشتری نمونه', 150000.00, 150000.00, 'cash', 'paid', 'فروش نمونه'),
('INV-2025-002', 'buy', 'تأمین‌کننده نمونه', 75000.00, 75000.00, 'bank_transfer', 'paid', 'خرید نمونه');
