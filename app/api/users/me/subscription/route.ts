import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getSubscriptionDetails } from '@/src/services/subscription';
import { logger } from '@/src/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const subscription = await getSubscriptionDetails(user.id);
    
    return NextResponse.json(subscription);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error fetching subscription:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch subscription details',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

