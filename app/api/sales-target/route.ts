import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
    try {
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

        const connection = await pool.getConnection();
        const [results] = await connection.execute(query, params);
        connection.release();

        return NextResponse.json({
            success: true,
            data: results,
        });
    } catch (error) {
        console.error('Error fetching sales targets:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch sales targets' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const { year, month, target_amount } = await req.json();

        if (!year || !month || target_amount === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const connection = await pool.getConnection();

        // Check if target exists for this month
        const [existing] = await connection.execute(
            'SELECT id FROM sales_targets WHERE year = ? AND month = ?',
            [year, month]
        );

        let result;
        if (Array.isArray(existing) && existing.length > 0) {
            // Update existing
            [result] = await connection.execute(
                'UPDATE sales_targets SET target_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE year = ? AND month = ?',
                [target_amount, year, month]
            );
        } else {
            // Insert new
            [result] = await connection.execute(
                'INSERT INTO sales_targets (year, month, target_amount) VALUES (?, ?, ?)',
                [year, month, target_amount]
            );
        }

        connection.release();

        return NextResponse.json({
            success: true,
            message: 'Sales target saved successfully',
            data: { year, month, target_amount },
        });
    } catch (error) {
        console.error('Error saving sales target:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to save sales target' },
            { status: 500 }
        );
    }
}

export async function PUT(req: NextRequest) {
    try {
        const { year, month, target_amount } = await req.json();

        if (!year || !month || target_amount === undefined) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const connection = await pool.getConnection();
        await connection.execute(
            'UPDATE sales_targets SET target_amount = ?, updated_at = CURRENT_TIMESTAMP WHERE year = ? AND month = ?',
            [target_amount, year, month]
        );
        connection.release();

        return NextResponse.json({
            success: true,
            message: 'Sales target updated successfully',
            data: { year, month, target_amount },
        });
    } catch (error) {
        console.error('Error updating sales target:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update sales target' },
            { status: 500 }
        );
    }
}
