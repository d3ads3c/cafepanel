import { NextRequest, NextResponse } from "next/server";
import { executeTransactionOnUserDB } from "@/lib/dbHelper";
import { getEnhancedAuth } from "@/lib/enhancedAuth";
import { hasPermission } from "@/lib/permissions";
import { getUserDatabaseFromRequest } from "@/lib/getUserDB";

export async function POST(request: NextRequest) {
  const auth = await getEnhancedAuth(request);
  if (!hasPermission(auth, "manage_accounting")) {
    return NextResponse.json(
      { success: false, message: "forbidden" },
      { status: 403 }
    );
  }

  try {
    const dbName = await getUserDatabaseFromRequest(request);
    if (!dbName) {
      return NextResponse.json(
        { success: false, message: "Unable to determine user database" },
        { status: 401 }
      );
    }

    const result = await executeTransactionOnUserDB(
      dbName,
      async (connection) => {
        const summary = {
          contactsInserted: 0,
          invoicesInserted: 0,
          itemsInserted: 0,
        };

        // Contacts
        const [contactRes]: any = await connection.execute(
          `
          INSERT INTO contacts (name, contact_type, created_at, updated_at)
          SELECT DISTINCT
            TRIM(o.customer_name) COLLATE utf8mb4_unicode_ci AS name,
            'customer' AS contact_type,
            NOW(),
            NOW()
          FROM orders o
          WHERE o.customer_name IS NOT NULL
            AND TRIM(o.customer_name) COLLATE utf8mb4_unicode_ci <> ''
            AND TRIM(o.customer_name) COLLATE utf8mb4_unicode_ci <> 'مشتری ناشناس' COLLATE utf8mb4_unicode_ci
            AND o.order_status = 'completed'
            AND NOT EXISTS (
              SELECT 1 FROM contacts c WHERE c.name COLLATE utf8mb4_unicode_ci = TRIM(o.customer_name) COLLATE utf8mb4_unicode_ci
            )
        `
        );
        summary.contactsInserted = contactRes?.affectedRows || 0;

        // Invoices
        const [invoiceRes]: any = await connection.execute(
          `
          INSERT INTO invoices (
            invoice_number,
            invoice_type,
            contact_id,
            contact_name,
            total_amount,
            discount_type,
            discount_value,
            tax_type,
            tax_value,
            final_amount,
            payment_status,
            invoice_date,
            due_date,
            notes,
            created_at,
            updated_at
          )
          SELECT
            CONCAT('ORD-', o.order_ID) COLLATE utf8mb4_unicode_ci AS invoice_number,
            'sell' COLLATE utf8mb4_unicode_ci AS invoice_type,
            c.id AS contact_id,
            COALESCE(
              NULLIF(TRIM(o.customer_name) COLLATE utf8mb4_unicode_ci, ''),
              'مشتری ناشناس' COLLATE utf8mb4_unicode_ci
            ) AS contact_name,
            IFNULL(o.total_price, 0) AS total_amount,
            'amount' AS discount_type,
            0 AS discount_value,
            'amount' AS tax_type,
            0 AS tax_value,
            IFNULL(o.total_price, 0) AS final_amount,
            'paid' COLLATE utf8mb4_unicode_ci AS payment_status,
            DATE(o.created_at) AS invoice_date,
            DATE(o.created_at) AS due_date,
            CONCAT('انتقال از سفارش شماره ', o.order_ID) COLLATE utf8mb4_unicode_ci AS notes,
            o.created_at,
            o.updated_at
          FROM orders o
          LEFT JOIN contacts c ON c.name COLLATE utf8mb4_unicode_ci = TRIM(o.customer_name) COLLATE utf8mb4_unicode_ci
          WHERE NOT EXISTS (
            SELECT 1 FROM invoices inv
            WHERE inv.invoice_number COLLATE utf8mb4_unicode_ci = CONCAT('ORD-', o.order_ID) COLLATE utf8mb4_unicode_ci
          )
          AND o.order_status = 'completed'
        `
        );
        summary.invoicesInserted = invoiceRes?.affectedRows || 0;

        // Items
        const [itemsRes]: any = await connection.execute(
          `
          INSERT INTO invoice_items (
            invoice_id,
            product_service,
            quantity,
            price,
            total_price,
            description,
            created_at,
            updated_at
          )
          SELECT
            inv.id AS invoice_id,
            oi.item_name COLLATE utf8mb4_unicode_ci AS product_service,
            oi.quantity,
            oi.item_price AS price,
            oi.item_price * oi.quantity AS total_price,
            CONCAT('آیتم منتقل‌شده از سفارش ', o.order_ID) COLLATE utf8mb4_unicode_ci AS description,
            o.created_at,
            o.updated_at
          FROM order_items oi
          JOIN orders o ON o.order_ID = oi.order_ID
          JOIN invoices inv ON inv.invoice_number COLLATE utf8mb4_unicode_ci = CONCAT('ORD-', o.order_ID) COLLATE utf8mb4_unicode_ci
          LEFT JOIN invoice_items existing
            ON existing.invoice_id = inv.id
            AND existing.product_service COLLATE utf8mb4_unicode_ci = oi.item_name COLLATE utf8mb4_unicode_ci
            AND existing.price = oi.item_price
            AND existing.quantity = oi.quantity
          WHERE existing.id IS NULL
        `
        );
        summary.itemsInserted = itemsRes?.affectedRows || 0;

        return summary;
      }
    );

    return NextResponse.json({
      success: true,
      message: "Orders migrated into accounting invoices",
      data: result,
    });
  } catch (error: any) {
    console.error("Orders integration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Migration failed",
      },
      { status: 500 }
    );
  }
}

