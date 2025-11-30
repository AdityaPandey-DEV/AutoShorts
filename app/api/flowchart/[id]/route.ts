import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getFlowchart, updateFlowchart, deleteFlowchart } from '@/src/services/flowchart';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const flowchartId = parseInt(id, 10);
    
    if (isNaN(flowchartId)) {
      return NextResponse.json(
        { error: 'Invalid flowchart ID' },
        { status: 400 }
      );
    }

    const flowchart = await getFlowchart(flowchartId, user.id);
    
    if (!flowchart) {
      return NextResponse.json(
        { error: 'Flowchart not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ flowchart });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error fetching flowchart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flowchart' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const flowchartId = parseInt(id, 10);
    
    if (isNaN(flowchartId)) {
      return NextResponse.json(
        { error: 'Invalid flowchart ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, flowchartData } = body;

    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (flowchartData !== undefined) updates.flowchartData = flowchartData;

    const flowchart = await updateFlowchart(flowchartId, user.id, updates);
    
    if (!flowchart) {
      return NextResponse.json(
        { error: 'Flowchart not found' },
        { status: 404 }
      );
    }

    logger.info(`Flowchart updated: ${flowchartId} by user ${user.id}`);
    return NextResponse.json({ flowchart });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error updating flowchart:', error);
    return NextResponse.json(
      { error: 'Failed to update flowchart' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const flowchartId = parseInt(id, 10);
    
    if (isNaN(flowchartId)) {
      return NextResponse.json(
        { error: 'Invalid flowchart ID' },
        { status: 400 }
      );
    }

    const deleted = await deleteFlowchart(flowchartId, user.id);
    
    if (!deleted) {
      return NextResponse.json(
        { error: 'Flowchart not found' },
        { status: 404 }
      );
    }

    logger.info(`Flowchart deleted: ${flowchartId} by user ${user.id}`);
    return NextResponse.json({ message: 'Flowchart deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error deleting flowchart:', error);
    return NextResponse.json(
      { error: 'Failed to delete flowchart' },
      { status: 500 }
    );
  }
}

