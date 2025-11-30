import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { chatWithFlowchartAI } from '@/src/services/flowchartAI';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    const { message, currentFlowchart, conversationHistory } = body;

    if (!message || !currentFlowchart) {
      return NextResponse.json(
        { error: 'Message and currentFlowchart are required' },
        { status: 400 }
      );
    }

    const result = await chatWithFlowchartAI(
      user.id,
      message,
      currentFlowchart,
      conversationHistory || []
    );

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error in AI chat:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get AI response',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

