import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getUsageForPeriod } from '@/src/services/admin';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const searchParams = request.nextUrl.searchParams;
    const month = searchParams.get('month') 
      ? parseInt(searchParams.get('month')!, 10) 
      : undefined;
    const year = searchParams.get('year') 
      ? parseInt(searchParams.get('year')!, 10) 
      : undefined;
    const userId = searchParams.get('user_id') 
      ? parseInt(searchParams.get('user_id')!, 10) 
      : undefined;

    const result = await getUsageForPeriod(month, year, userId);
    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('Error fetching usage:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}




