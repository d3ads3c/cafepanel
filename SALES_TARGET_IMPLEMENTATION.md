# Sales Target Implementation Guide

## Overview
The sales target (تارگت فروش) feature allows users to set and manage monthly sales goals, with data stored in the database.

## What Was Implemented

### 1. Database Schema
**File**: `migrations/2025-11-27-create-sales-targets-table.sql`

```sql
CREATE TABLE sales_targets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL,
    target_amount DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_year_month (year, month)
)
```

- **id**: Unique identifier for each target
- **year**: The year of the target (e.g., 2025)
- **month**: The month of the target (1-12)
- **target_amount**: The monthly sales target in currency
- **created_at/updated_at**: Automatic timestamps
- **Unique constraint**: Ensures only one target per month

### 2. API Endpoint
**File**: `app/api/sales-target/route.ts`

#### GET Request
```
GET /api/sales-target?year=2025&month=11
```
Fetches the sales target for a specific month. Returns the most recent target if no params provided.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "year": 2025,
      "month": 11,
      "target_amount": 100000000,
      "created_at": "2025-11-27T10:00:00.000Z",
      "updated_at": "2025-11-27T10:00:00.000Z"
    }
  ]
}
```

#### POST Request
```
POST /api/sales-target
Content-Type: application/json

{
  "year": 2025,
  "month": 11,
  "target_amount": 100000000
}
```
Creates a new target or updates an existing one for the specified month.

**Response**:
```json
{
  "success": true,
  "message": "Sales target saved successfully",
  "data": {
    "year": 2025,
    "month": 11,
    "target_amount": 100000000
  }
}
```

#### PUT Request
```
PUT /api/sales-target
Content-Type: application/json

{
  "year": 2025,
  "month": 11,
  "target_amount": 100000000
}
```
Updates an existing sales target.

### 3. Dashboard UI Integration
**File**: `app/(panel)/dashboard/page.tsx`

#### New State Variables:
- `salesTarget`: Current monthly target (number)
- `salesTargetModalOpen`: Controls modal visibility (boolean)
- `salesTargetInput`: Input field value for editing (string)

#### New Functions:
- `fetchSalesTarget()`: Fetches current month's target from database
- `saveSalesTarget()`: Saves the edited target to database

#### Visual Components:

1. **Sales Target Card** (Right sidebar on desktop)
   - Displays a donut chart showing target vs. actual sales
   - Shows daily target, today's sales, and achievement percentage
   - Edit button opens the modal

2. **Sales Target Modal**
   - Input field for entering new target amount
   - Displays current target value
   - Cancel and Save buttons
   - Shows toast notifications on success/error

#### Donut Chart
- Shows two series:
  - Teal segment: Actual daily revenue
  - Gray segment: Remaining to reach target
- Displays achievement percentage

### 4. Features

✅ **Set Monthly Target**: Users can set or update the monthly sales target
✅ **Database Storage**: Targets are saved in MariaDB with year/month unique constraint
✅ **Real-time Display**: Dashboard shows current target and progress
✅ **Visual Progress**: Donut chart visualizes achievement percentage
✅ **Auto-load**: Target is automatically fetched when dashboard loads
✅ **Toast Notifications**: User feedback on save success/failure

## How to Use

### Initial Setup
1. Run the migration to create the table:
```bash
# Connect to your MariaDB database and run:
mysql -u root -p cafegah < migrations/2025-11-27-create-sales-targets-table.sql
```

2. Start the application
3. Navigate to the dashboard

### Setting a Target
1. Look for the "تارگت فروش" card on the right sidebar (desktop view)
2. Click the edit button (pencil icon)
3. Enter the monthly target amount in تومان
4. Click "ذخیره" (Save)
5. A success message will appear

### Viewing Target Progress
- The sales target card shows:
  - Current target amount
  - Today's actual sales
  - Achievement percentage
  - Visual donut chart representation

## File Structure
```
migrations/
  └── 2025-11-27-create-sales-targets-table.sql
app/
  ├── (panel)/
  │   └── dashboard/
  │       └── page.tsx (Updated)
  └── api/
      └── sales-target/
          └── route.ts (New)
```

## Technical Details

### Database Uniqueness
The `UNIQUE KEY unique_year_month (year, month)` constraint ensures:
- Only one target can exist per month
- POST requests automatically update if target already exists
- No duplicate data

### Monthly Auto-detection
The system automatically detects the current month:
```typescript
const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1; // 1-12
```

### Error Handling
- Invalid input validation (must be > 0)
- Network error handling with toast notifications
- Database error responses
- Empty/NaN value prevention

### Default Value
If no target is set, the dashboard defaults to 10,000,000 تومان until a new value is saved.

## Future Enhancements
- View historical targets for previous months
- Set different targets for different products/categories
- Receive alerts when approaching/exceeding target
- Generate reports on target achievement
- Support for weekly or daily targets
