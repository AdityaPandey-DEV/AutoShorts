import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getAllPlans, createPlan } from '@/src/services/plans';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const includeInactive = searchParams.get('include_inactive') === 'true';

    const plans = await getAllPlans(includeInactive);

    return NextResponse.json({ plans });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      planName,
      displayName,
      priceMonthly,
      priceYearly,
      maxVideosPerMonth,
      maxVideoLengthSeconds,
      features,
      isActive,
    } = body;

    // Validate required fields
    if (!planName || !displayName || priceMonthly === undefined || !maxVideoLengthSeconds || !features) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate features structure
    if (
      typeof features !== 'object' ||
      typeof features.maxVideoLength !== 'number' ||
      !Array.isArray(features.videoQuality) ||
      typeof features.customBranding !== 'boolean' ||
      typeof features.priorityProcessing !== 'boolean' ||
      typeof features.apiAccess !== 'boolean' ||
      typeof features.customTTSVoices !== 'boolean' ||
      typeof features.advancedAnalytics !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Invalid features structure' },
        { status: 400 }
      );
    }

    const plan = await createPlan({
      planName,
      displayName,
      priceMonthly: parseFloat(priceMonthly),
      priceYearly: priceYearly ? parseFloat(priceYearly) : undefined,
      maxVideosPerMonth: maxVideosPerMonth !== undefined ? parseInt(maxVideosPerMonth, 10) : null,
      maxVideoLengthSeconds: parseInt(maxVideoLengthSeconds, 10),
      features,
      isActive: isActive !== undefined ? isActive : true,
    });

    return NextResponse.json({ plan }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (error.code === '23505') {
      // Unique violation (duplicate plan_name)
      return NextResponse.json(
        { error: 'Plan with this name already exists' },
        { status: 409 }
      );
    }
    
    logger.error('Error creating plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create plan' },
      { status: 500 }
    );
  }
}

