-- Add payment_method column to orders table
ALTER TABLE orders ADD COLUMN payment_method VARCHAR(32) DEFAULT NULL AFTER order_status;