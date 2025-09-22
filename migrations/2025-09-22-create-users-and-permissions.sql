-- Create users table with permissions
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255),
  email VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  permissions JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Optional: permissions can also be a comma-separated set for older MariaDB versions without JSON
-- ALTER TABLE users ADD COLUMN permissions_text TEXT NULL;


