import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { updateUserSubscription, getUserWithDetails } from '@/src/services/admin';
import { logger } from '@/src/utils/logger';
import pool from '@/src/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { subscriptionStatus, subscriptionPlan, subscriptionEndsAt, trialEndsAt } = body;

    await updateUserSubscription(userId, {
      subscriptionStatus,
      subscriptionPlan,
      subscriptionEndsAt: subscriptionEndsAt ? new Date(subscriptionEndsAt) : undefined,
      trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : undefined,
    });

    const updatedUser = await getUserWithDetails(userId);
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'cancel') {
      await updateUserSubscription(userId, {
        subscriptionStatus: 'cancelled',
      });
    } else if (action === 'extend_trial') {
      const { days } = body;
      const daysToAdd = days || 7;
      const client = await pool.connect();
      try {
        const result = await client.query(
          'SELECT trial_ends_at FROM users WHERE id = $1',
          [userId]
        );
        if (result.rows.length > 0) {
          const currentTrialEnd = result.rows[0].trial_ends_at 
            ? new Date(result.rows[0].trial_ends_at)
            : new Date();
          const newTrialEnd = new Date(currentTrialEnd);
          newTrialEnd.setDate(newTrialEnd.getDate() + daysToAdd);
          
          await updateUserSubscription(userId, {
            trialEndsAt: newTrialEnd,
          });
        }
      } finally {
        client.release();
      }
    }

    const updatedUser = await getUserWithDetails(userId);
    return NextResponse.json(updatedUser);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('Error performing subscription action:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}

