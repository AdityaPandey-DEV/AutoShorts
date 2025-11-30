import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import pool from '@/src/db';
import { cancelSubscription } from '@/src/services/subscription';
import { cancelStripeSubscription } from '@/src/services/stripe';
import { logger } from '@/src/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT stripe_subscription_id, paypal_subscription_id FROM users WHERE id = $1',
        [user.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userData = result.rows[0];

      // Cancel subscription with payment provider
      if (userData.stripe_subscription_id) {
        await cancelStripeSubscription(userData.stripe_subscription_id);
      } else if (userData.paypal_subscription_id) {
        const { cancelPayPalSubscription } = require('@/src/services/paypal');
        await cancelPayPalSubscription(userData.paypal_subscription_id);
      }

      // Update database
      await cancelSubscription(user.id);

      return NextResponse.json({ success: true, message: 'Subscription cancelled successfully' });
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
    
    logger.error('Error cancelling subscription:', error);
    return NextResponse.json(
      {
        error: 'Failed to cancel subscription',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

