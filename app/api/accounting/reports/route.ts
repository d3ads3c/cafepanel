import { NextRequest, NextResponse } from 'next/server'
import pool from '@/lib/db'
import { getAuth } from '@/lib/auth'
import { hasPermission } from '@/lib/permissions'

// GET /api/accounting/reports
// Query params: from=YYYY-MM-DD, to=YYYY-MM-DD, type=all|buy|sell
export async function GET(request: NextRequest) {
  const auth = await getAuth()
  if (!hasPermission(auth, 'manage_accounting')) {
    return NextResponse.json({ success: false, message: 'forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const invoiceType = searchParams.get('type') as 'buy' | 'sell' | 'all' | null

  const whereClauses: string[] = []
  const params: any[] = []

  if (from) {
    whereClauses.push('DATE(i.created_at) >= ?')
    params.push(from)
  }
  if (to) {
    whereClauses.push('DATE(i.created_at) <= ?')
    params.push(to)
  }
  if (invoiceType && invoiceType !== 'all') {
    whereClauses.push('i.invoice_type = ?')
    params.push(invoiceType)
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const connection = await pool.getConnection()
  try {
    // Totals and KPIs
    const [totalsRows] = await connection.query(
      `SELECT 
        COUNT(*) as invoice_count,
        COALESCE(SUM(i.total_amount), 0) as total_amount,
        COALESCE(SUM(i.final_amount), 0) as final_amount,
        SUM(CASE WHEN i.payment_status = 'paid' THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN i.payment_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN i.payment_status = 'partial' THEN 1 ELSE 0 END) as partial_count,
        SUM(CASE WHEN i.payment_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count
      FROM invoices i
      ${whereSql}`,
      params,
    )

    // Daily series for chart
    const [seriesRows] = await connection.query(
      `SELECT DATE(i.created_at) as day,
              SUM(i.final_amount) as amount,
              SUM(CASE WHEN i.invoice_type = 'sell' THEN i.final_amount ELSE 0 END) as sell_amount,
              SUM(CASE WHEN i.invoice_type = 'buy' THEN i.final_amount ELSE 0 END) as buy_amount
       FROM invoices i
       ${whereSql}
       GROUP BY DATE(i.created_at)
       ORDER BY DATE(i.created_at)`,
      params,
    )

    // Payment method breakdown
    const [paymentRows] = await connection.query(
      `SELECT i.payment_method, COUNT(*) as count, SUM(i.final_amount) as amount
       FROM invoices i
       ${whereSql}
       GROUP BY i.payment_method
       ORDER BY amount DESC`,
      params,
    )

    // Top contacts by revenue/expense
    const [topContactsRows] = await connection.query(
      `SELECT 
          COALESCE(i.customer_supplier_name, 'نامشخص') as name,
          COUNT(*) as invoice_count,
          SUM(i.final_amount) as amount
       FROM invoices i
       ${whereSql}
       GROUP BY COALESCE(i.customer_supplier_name, 'نامشخص')
       ORDER BY amount DESC
       LIMIT 10`,
      params,
    )

    // Aging: pending and partial by age buckets
    const [agingRows] = await connection.query(
      `SELECT 
          SUM(CASE WHEN DATEDIFF(CURDATE(), DATE(i.created_at)) <= 30 AND i.payment_status IN ('pending','partial') THEN i.final_amount ELSE 0 END) as bucket_0_30,
          SUM(CASE WHEN DATEDIFF(CURDATE(), DATE(i.created_at)) BETWEEN 31 AND 60 AND i.payment_status IN ('pending','partial') THEN i.final_amount ELSE 0 END) as bucket_31_60,
          SUM(CASE WHEN DATEDIFF(CURDATE(), DATE(i.created_at)) BETWEEN 61 AND 90 AND i.payment_status IN ('pending','partial') THEN i.final_amount ELSE 0 END) as bucket_61_90,
          SUM(CASE WHEN DATEDIFF(CURDATE(), DATE(i.created_at)) > 90 AND i.payment_status IN ('pending','partial') THEN i.final_amount ELSE 0 END) as bucket_90_plus
       FROM invoices i
       ${whereSql}`,
      params,
    )

    // Monthly summary (YYYY-MM)
    const [monthlyRows] = await connection.query(
      `SELECT DATE_FORMAT(i.created_at, '%Y-%m') as ym,
              SUM(CASE WHEN i.invoice_type = 'sell' THEN i.final_amount ELSE 0 END) as sell_amount,
              SUM(CASE WHEN i.invoice_type = 'buy' THEN i.final_amount ELSE 0 END) as buy_amount,
              SUM(i.tax_amount) as tax_total,
              SUM(i.discount_amount) as discount_total,
              SUM(i.final_amount) as total
       FROM invoices i
       ${whereSql}
       GROUP BY DATE_FORMAT(i.created_at, '%Y-%m')
       ORDER BY ym`,
      params,
    )

    // P&L approximation
    const [pnlRows] = await connection.query(
      `SELECT 
         SUM(CASE WHEN i.invoice_type = 'sell' THEN i.final_amount ELSE 0 END) as revenue,
         SUM(CASE WHEN i.invoice_type = 'buy' THEN i.final_amount ELSE 0 END) as cogs,
         SUM(i.tax_amount) as tax_total,
         SUM(i.discount_amount) as discount_total
       FROM invoices i
       ${whereSql}`,
      params,
    )

    // AR/AP: pending or partial amounts split by type
    const [arapRows] = await connection.query(
      `SELECT 
         SUM(CASE WHEN i.invoice_type = 'sell' AND i.payment_status IN ('pending','partial') THEN i.final_amount ELSE 0 END) as receivables,
         SUM(CASE WHEN i.invoice_type = 'buy' AND i.payment_status IN ('pending','partial') THEN i.final_amount ELSE 0 END) as payables
       FROM invoices i
       ${whereSql}`,
      params,
    )

    // Cashflow by payment method per day
    const [cashflowRows] = await connection.query(
      `SELECT DATE(i.created_at) as day, i.payment_method,
              SUM(i.final_amount) as amount
       FROM invoices i
       ${whereSql}
       GROUP BY DATE(i.created_at), i.payment_method
       ORDER BY DATE(i.created_at)`,
      params,
    )

    // Orders data for integration
    const [ordersRows] = await connection.query(
      `SELECT 
        COUNT(*) as order_count,
        COALESCE(SUM(o.total_price), 0) as order_revenue,
        SUM(CASE WHEN o.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
        SUM(CASE WHEN o.status = 'completed' THEN o.total_price ELSE 0 END) as completed_revenue,
        SUM(CASE WHEN o.status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN o.status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders
      FROM orders o
      ${whereSql.replace('i.', 'o.').replace('invoices i', 'orders o')}`,
      params,
    )

    // Orders daily series
    const [ordersSeriesRows] = await connection.query(
      `SELECT DATE(o.created_at) as day,
              COUNT(*) as order_count,
              SUM(o.total_price) as revenue,
              SUM(CASE WHEN o.status = 'completed' THEN o.total_price ELSE 0 END) as completed_revenue
       FROM orders o
       ${whereSql.replace('i.', 'o.').replace('invoices i', 'orders o')}
       GROUP BY DATE(o.created_at)
       ORDER BY DATE(o.created_at)`,
      params,
    )

    // Orders by payment method
    const [ordersPaymentRows] = await connection.query(
      `SELECT o.payment_method, COUNT(*) as count, SUM(o.total_price) as amount
       FROM orders o
       ${whereSql.replace('i.', 'o.').replace('invoices i', 'orders o')}
       GROUP BY o.payment_method
       ORDER BY amount DESC`,
      params,
    )

    return NextResponse.json({
      success: true,
      data: {
        totals: Array.isArray(totalsRows) ? (totalsRows as any[])[0] : totalsRows,
        series: seriesRows,
        payment_methods: paymentRows,
        top_contacts: topContactsRows,
        aging: Array.isArray(agingRows) ? (agingRows as any[])[0] : agingRows,
        monthly: monthlyRows,
        pnl: Array.isArray(pnlRows) ? (pnlRows as any[])[0] : pnlRows,
        arap: Array.isArray(arapRows) ? (arapRows as any[])[0] : arapRows,
        cashflow_by_method: cashflowRows,
        orders: Array.isArray(ordersRows) ? (ordersRows as any[])[0] : ordersRows,
        orders_series: ordersSeriesRows,
        orders_payment_methods: ordersPaymentRows,
      },
    })
  } catch (e) {
    console.error('Error generating reports:', e)
    return NextResponse.json({ success: false, message: 'خطا در تولید گزارش' }, { status: 500 })
  } finally {
    connection.release()
  }
}


