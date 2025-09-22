-- Add discount fields to customers
ALTER TABLE customers
  ADD COLUMN discount_type VARCHAR(10) NULL AFTER notes,
  ADD COLUMN discount_value DECIMAL(10,2) NULL AFTER discount_type;

-- Optional: ensure sensible defaults (no discount)
UPDATE customers SET discount_type = NULL, discount_value = NULL WHERE discount_type IS NULL;


