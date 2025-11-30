import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { saveFlowchart, getUserFlowcharts } from '@/src/services/flowchart';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const user = await requireAuth();
    const flowcharts = await getUserFlowcharts(user.id);
    return NextResponse.json({ flowcharts });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error fetching flowcharts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flowcharts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { name, description, flowchartData } = body;

    if (!name || !flowchartData) {
      return NextResponse.json(
        { error: 'Name and flowchartData are required' },
        { status: 400 }
      );
    }

    const flowchart = await saveFlowchart(user.id, name, flowchartData, description);
    
    logger.info(`Flowchart created: ${flowchart.id} by user ${user.id}`);
    return NextResponse.json({ flowchart });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error creating flowchart:', error);
    return NextResponse.json(
      { error: 'Failed to create flowchart' },
      { status: 500 }
    );
  }
}

