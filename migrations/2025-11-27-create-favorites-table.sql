-- Create favorites table for storing favorite menu items
CREATE TABLE IF NOT EXISTS favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    menu_ID INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_ID) REFERENCES menu(menu_ID) ON DELETE CASCADE,
    UNIQUE KEY unique_menu (menu_ID)
);
