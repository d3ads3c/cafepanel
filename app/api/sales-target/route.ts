import { NextRequest, NextResponse } from 'next/server';
import { executeQueryOnUserDB } from '@/lib/dbHelper';
import { getEnhancedAuth } from '@/lib/enhancedAuth';
import { hasPermission } from '@/lib/permissions';
import { getUserDatabaseFromRequest } from '@/lib/getUserDB';

export async function GET(req: NextRequest) {
    try {
        const dbName = await getUserDatabaseFromRequest(req);
        if (!dbName) {
            return NextResponse.json(
                { success: false, message: 'Unable to determine user database' },
                { status: 401 }
            );
        }

        const searchParams = req.nextUrl.searchParams;
        const year = searchParams.get('year');
        const month = searchParams.get('month');

        let query = 'SELECT * FROM sales_targets';
        const params: (number | string)[] = [];

        if (year && month) {
            query += ' WHERE year = ? AND month = ?';
            params.push(parseInt(year), parseInt(month));
        }

        query += ' ORDER BY year DESC, month DESC LIMIT 1';

        const results = await executeQueryOnUserDB(dbName, async (connection) => {
            const [rows] = await connection.execute(query, params);
            return rows;
        });

        return NextResponse.json({
            success: true,
            data: results,
        });
    } catch (error: any) {
        console.error('Error fetching sales targets:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch sales targets' },
            { status: error.status || 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const auth = await getEnhancedAuth(req);
    if (!hasPermission(auth, 'view_dashboard')) {
        return NextResponse.json(
            { success: false, message: 'forbidden' },
            { status: 403 }
        );
    }
    try {
        const dbName = await getUserDatabaseFromRequest(req);
        if (!dbName) {
            return NextResponse.json(
                { success: false, message: 'Unable to determine user database' },
                { status: 401 }
            );
        }

        const { year, month, target_amount } = await req.json();

        if (!year || !month || target_amount === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await executeQueryOnUserDB(dbName, async (connection) => {
            // Check if target exists for this month
            const [existing] = await connection.execute(
                'SELECT id FROM sales_targets WHERE year = ? AND month = ?',
                [year, month]
            );

            if (Array.isArray(existing) && existing.length > 0) {
                // Update existing
                await connection.execute(
                    'UPDATE sales_targets SET target_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE year = ? AND month = ?',
                    [target_amount, year, month]
                );
            } else {
                // Insert new
                await connection.execute(
                    'INSERT INTO sales_targets (year, month, target_amount) VALUES (?, ?, ?)',
                    [year, month, target_amount]
                );
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Sales target saved successfully',
            data: { year, month, target_amount },
        });
    } catch (error: any) {
        console.error('Error saving sales target:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to save sales target' },
            { status: error.status || 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    const auth = await getEnhancedAuth(req);
    if (!hasPermission(auth, 'view_dashboard')) {
        return NextResponse.json(
            { success: false, message: 'forbidden' },
            { status: 403 }
        );
    }
    try {
        const dbName = await getUserDatabaseFromRequest(req);
        if (!dbName) {
            return NextResponse.json(
                { success: false, message: 'Unable to determine user database' },
                { status: 401 }
            );
        }

        const { year, month, target_amount } = await req.json();

        if (!year || !month || target_amount === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        await executeQueryOnUserDB(dbName, async (connection) => {
            await connection.execute(
                'UPDATE sales_targets SET target_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE year = ? AND month = ?',
                [target_amount, year, month]
            );
        });

        return NextResponse.json({
            success: true,
            message: 'Sales target updated successfully',
            data: { year, month, target_amount },
        });
    } catch (error: any) {
        console.error('Error updating sales target:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to update sales target' },
            { status: error.status || 500 }
        );
    }
}
