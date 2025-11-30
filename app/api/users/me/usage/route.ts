import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getCurrentMonthUsage } from '@/src/services/usage';
import { getSubscriptionDetails } from '@/src/services/subscription';
import { logger } from '@/src/utils/logger';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const usage = await getCurrentMonthUsage(user.id);
    const subscription = await getSubscriptionDetails(user.id);
    
    return NextResponse.json({
      currentMonth: {
        videosGenerated: usage.videosGenerated,
        limit: subscription.planDetails?.maxVideosPerMonth,
        remaining: subscription.planDetails?.maxVideosPerMonth 
          ? subscription.planDetails.maxVideosPerMonth - usage.videosGenerated
          : null,
      },
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
      },
    });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error fetching usage:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch usage statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

