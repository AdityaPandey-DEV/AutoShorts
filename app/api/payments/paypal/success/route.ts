import { NextRequest, NextResponse } from 'next/server';
import { captureOrder } from '@/src/services/paypal';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'orderId is required' },
        { status: 400 }
      );
    }

    await captureOrder(orderId);

    return NextResponse.json({ success: true, message: 'Payment processed successfully' });
  } catch (error) {
    logger.error('PayPal success handler error:', error);
    return NextResponse.json(
      {
        error: 'Payment processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

