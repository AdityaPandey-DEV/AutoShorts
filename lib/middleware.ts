import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from './auth';
import { getUserPlan, checkTrialStatus } from '@/src/services/subscription';
import { checkCanGenerate } from '@/src/services/usage';
import { getPlan, TRIAL_CONFIG } from '@/src/config/plans';
import { hasActiveSubscription } from '@/src/services/subscription';

/**
 * Check if user can generate videos (usage limits)
 */
export async function checkVideoLimit(request: NextRequest) {
  try {
    const user = await requireAuth();
    
    // Get user's plan
    const userPlan = await getUserPlan(user.id);
    const planDetails = userPlan.plan ? getPlan(userPlan.plan) : null;

    // Check if user has active subscription or trial
    const hasActive = await hasActiveSubscription(user.id);
    if (!hasActive) {
      return {
        error: NextResponse.json({
          error: 'Subscription required',
          message: 'Your trial has expired. Please upgrade to continue.',
        }, { status: 403 }),
        user: null,
        usageInfo: null,
      };
    }

    // Check if user is on trial
    const isTrial = await checkTrialStatus(user.id);
    
    // For trial users, use daily limit; for paid users, use monthly limit
    let maxVideos: number | null;
    let maxVideosPerDay: number | undefined;
    
    if (isTrial) {
      maxVideosPerDay = TRIAL_CONFIG.maxVideosPerDay;
      maxVideos = null; // Not used for trial users
    } else {
      maxVideos = planDetails?.maxVideosPerMonth || 10;
      maxVideosPerDay = undefined;
    }

    // Check usage limits (passes trial status and daily limit)
    const canGenerate = await checkCanGenerate(user.id, maxVideos, isTrial, maxVideosPerDay);

    if (!canGenerate.canGenerate) {
      return {
        error: NextResponse.json({
          error: 'Usage limit reached',
          message: canGenerate.reason || (isTrial ? 'Daily video limit reached' : 'Monthly video limit reached'),
          currentUsage: canGenerate.currentUsage,
          limit: canGenerate.limit,
        }, { status: 403 }),
        user: null,
        usageInfo: null,
      };
    }

    return {
      error: null,
      user,
      usageInfo: {
        currentUsage: canGenerate.currentUsage,
        limit: canGenerate.limit,
        plan: userPlan.plan,
        isTrial,
      },
    };
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return {
        error: NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        ),
        user: null,
        usageInfo: null,
      };
    }
    
    return {
      error: NextResponse.json(
        {
          error: 'Failed to check usage limits',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      ),
      user: null,
      usageInfo: null,
    };
  }
}




