# Database Setup Guide

## MariaDB Configuration

### 1. Install Dependencies
```bash
npm install mysql2
```

### 2. Environment Variables
Create a `.env.local` file in your project root with the following variables:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=cafepanel
DB_PORT=3306
```

### 3. Database Table Structure

Create the `menu` table in your MariaDB database:

```sql
CREATE TABLE menu (
    menu_ID INT AUTO_INCREMENT PRIMARY KEY,
    menu_name VARCHAR(255) NOT NULL,
    menu_info TEXT,
    menu_price DECIMAL(10,2) NOT NULL,
    menu_img VARCHAR(500),
    menu_category INT,
    menu_status TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (menu_category) REFERENCES categories(category_ID)
);
```

Create the `categories` table:

```sql
CREATE TABLE categories (
    category_ID INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Create the `orders` table:

```sql
CREATE TABLE orders (
    order_ID INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255),
    table_number VARCHAR(50),
    total_items INT NOT NULL DEFAULT 0,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    order_status ENUM('pending', 'preparing', 'ready', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

Create the `order_items` table for order details:

```sql
CREATE TABLE order_items (
    order_item_ID INT AUTO_INCREMENT PRIMARY KEY,
    order_ID INT NOT NULL,
    menu_ID INT NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    item_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (order_ID) REFERENCES orders(order_ID) ON DELETE CASCADE,
    FOREIGN KEY (menu_ID) REFERENCES menu(menu_ID)
);
```

### 4. Database Connection
The application uses a connection pool for better performance. The configuration is in `lib/db.ts`.

### 5. API Endpoints
- Menu creation: `POST /api/menu/new`
- Menu listing: `GET /api/menu/all`
- Categories: `GET /api/categories`
- Orders: `POST /api/orders` (create), `GET /api/orders` (list)

### 6. Data Flow
1. Form data is submitted with optional image
2. Image is saved to `/public/img/product/` with unique filename
3. Menu data is inserted into MariaDB table
4. Response includes the new menu item ID and data

### 7. Table Fields
- `menu_ID`: Auto-increment primary key
- `menu_name`: Product name (required)
- `menu_info`: Product description
- `menu_price`: Product price (required)
- `menu_img`: Image file path (optional)
- `menu_status`: Active status (1 = active, 0 = inactive)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### 8. Orders Table Fields
- `order_ID`: Auto-increment primary key
- `customer_name`: Customer name (optional)
- `table_number`: Table number (optional)
- `total_items`: Total number of items in order
- `total_price`: Total price of the order
- `order_status`: Order status (pending, preparing, ready, completed, cancelled)
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

### 9. Order Items Table Fields
- `order_item_ID`: Auto-increment primary key
- `order_ID`: Foreign key to orders table
- `menu_ID`: Foreign key to menu table
- `item_name`: Item name (stored for historical reference)
- `item_price`: Item price (stored for historical reference)
- `quantity`: Quantity of the item
- `created_at`: Creation timestamp
