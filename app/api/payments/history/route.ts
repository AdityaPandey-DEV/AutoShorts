import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import pool from '@/src/db';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT id, amount, currency, payment_provider, status, created_at
         FROM payments
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [user.id]
      );

      return NextResponse.json({
        payments: result.rows.map((row: any) => ({
          id: row.id,
          amount: parseFloat(row.amount),
          currency: row.currency,
          provider: row.payment_provider,
          status: row.status,
          createdAt: row.created_at,
        })),
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error fetching payment history:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch payment history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

