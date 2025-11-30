import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getPlanById, updatePlan, deletePlan } from '@/src/services/plans';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const planId = parseInt(id, 10);

    if (isNaN(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    const plan = await getPlanById(planId);

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ plan });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('Error fetching plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plan' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const planId = parseInt(id, 10);

    if (isNaN(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

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

    // Validate features if provided
    if (features !== undefined) {
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
    }

    const updateData: any = {};
    if (planName !== undefined) updateData.planName = planName;
    if (displayName !== undefined) updateData.displayName = displayName;
    if (priceMonthly !== undefined) updateData.priceMonthly = parseFloat(priceMonthly);
    if (priceYearly !== undefined) updateData.priceYearly = priceYearly ? parseFloat(priceYearly) : null;
    if (maxVideosPerMonth !== undefined) updateData.maxVideosPerMonth = maxVideosPerMonth !== null ? parseInt(maxVideosPerMonth, 10) : null;
    if (maxVideoLengthSeconds !== undefined) updateData.maxVideoLengthSeconds = parseInt(maxVideoLengthSeconds, 10);
    if (features !== undefined) updateData.features = features;
    if (isActive !== undefined) updateData.isActive = isActive;

    const plan = await updatePlan(planId, updateData);

    return NextResponse.json({ plan });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (error.message === 'Plan not found') {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }

    if (error.code === '23505') {
      // Unique violation (duplicate plan_name)
      return NextResponse.json(
        { error: 'Plan with this name already exists' },
        { status: 409 }
      );
    }
    
    logger.error('Error updating plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update plan' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const planId = parseInt(id, 10);

    if (isNaN(planId)) {
      return NextResponse.json(
        { error: 'Invalid plan ID' },
        { status: 400 }
      );
    }

    await deletePlan(planId);

    return NextResponse.json({ message: 'Plan deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    if (error.message === 'Plan not found') {
      return NextResponse.json(
        { error: 'Plan not found' },
        { status: 404 }
      );
    }
    
    logger.error('Error deleting plan:', error);
    return NextResponse.json(
      { error: 'Failed to delete plan' },
      { status: 500 }
    );
  }
}

