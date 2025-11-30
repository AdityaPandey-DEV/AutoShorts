import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createCheckoutSession } from '@/src/services/stripe';
import { logger } from '@/src/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { planName, period } = await request.json();

    if (!planName) {
      return NextResponse.json(
        { error: 'planName is required' },
        { status: 400 }
      );
    }

    const session = await createCheckoutSession(
      user.id,
      planName,
      period || 'monthly'
    );

    return NextResponse.json({
      sessionId: session.sessionId,
      url: session.url,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Stripe checkout error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

