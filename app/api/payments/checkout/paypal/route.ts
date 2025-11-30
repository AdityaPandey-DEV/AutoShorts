import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createOrder } from '@/src/services/paypal';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

    const order = await createOrder(
      user.id,
      planName,
      period || 'monthly'
    );

    return NextResponse.json({
      orderId: order.orderId,
      approvalUrl: order.approvalUrl,
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('PayPal checkout error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create PayPal order',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

