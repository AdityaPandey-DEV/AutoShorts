import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { chatWithFlowchartAI } from '@/src/services/flowchartAI';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[AI Chat Route] Starting POST request processing');
    
    // Step 1: Authenticate user
    console.log('[AI Chat Route] Step 1: Authenticating user...');
    const user = await requireAuth();
    console.log('[AI Chat Route] User authenticated:', { id: user.id, email: user.email });
    
    // Step 2: Parse request body
    let body: any;
    try {
      console.log('[AI Chat Route] Step 2: Parsing request JSON...');
      body = await request.json();
      console.log('[AI Chat Route] Request parsed:', { 
        hasMessage: !!body.message, 
        hasFlowchart: !!body.currentFlowchart,
        conversationHistoryLength: body.conversationHistory?.length || 0
      });
    } catch (parseError: any) {
      console.error('[AI Chat Route] JSON parsing error:');
      console.error('[AI Chat Route] Raw parse error:', parseError);
      console.error('[AI Chat Route] Parse error message:', parseError?.message);
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError?.message || String(parseError) },
        { status: 400 }
      );
    }

    const { message, currentFlowchart, conversationHistory } = body;

    // Step 3: Validate required fields
    console.log('[AI Chat Route] Step 3: Validating required fields...');
    if (!message || !currentFlowchart) {
      console.error('[AI Chat Route] Validation failed:', { hasMessage: !!message, hasFlowchart: !!currentFlowchart });
      return NextResponse.json(
        { error: 'Message and currentFlowchart are required' },
        { status: 400 }
      );
    }

    // Step 4: Call flowchart AI service
    console.log('[AI Chat Route] Step 4: Calling chatWithFlowchartAI...');
    const result = await chatWithFlowchartAI(
      user.id,
      message,
      currentFlowchart,
      conversationHistory || []
    );
    
    console.log('[AI Chat Route] AI chat completed successfully');
    return NextResponse.json(result);
  } catch (error: any) {
    // Comprehensive error logging
    console.error('[AI Chat Route] ====== ERROR CAUGHT ======');
    console.error('[AI Chat Route] Raw error object:', error);
    console.error('[AI Chat Route] Error type:', error?.constructor?.name || typeof error);
    console.error('[AI Chat Route] Error message (direct):', error?.message);
    console.error('[AI Chat Route] Error toString():', error?.toString?.());
    console.error('[AI Chat Route] String(error):', String(error));
    console.error('[AI Chat Route] Error code:', error?.code);
    console.error('[AI Chat Route] Error stack:', error?.stack);
    console.error('[AI Chat Route] Full error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('[AI Chat Route] ===========================');
    
    // Also use logger
    logger.error('Error in AI chat:', {
      rawError: error,
      errorType: error?.constructor?.name || typeof error,
      message: error?.message,
      toString: error?.toString?.(),
      code: error?.code,
      stack: error?.stack,
    });
    
    // Handle specific error types
    const errorMessageStr = error?.message || error?.toString?.() || String(error);
    
    if (errorMessageStr === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Extract error message in multiple ways
    let errorMessage = 'Failed to get AI response';
    let statusCode = 500;
    
    const extractedMessage = error?.message || error?.toString?.() || String(error) || 'Unknown error';
    
    if (extractedMessage.includes('Gemini API key not found')) {
      errorMessage = 'Gemini API key not configured. Please add the API key in admin settings.';
      statusCode = 500;
    } else if (extractedMessage.includes('Failed to retrieve Gemini API key')) {
      errorMessage = 'Failed to retrieve API key. Please check admin settings.';
      statusCode = 500;
    } else if (extractedMessage.includes('Database connection')) {
      errorMessage = 'Database connection failed. Please try again later.';
      statusCode = 503;
    } else if (extractedMessage && extractedMessage !== 'Unknown error') {
      errorMessage = extractedMessage;
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        errorType: error?.constructor?.name || typeof error,
        details: process.env.NODE_ENV === 'development' ? extractedMessage : undefined
      },
      { status: statusCode }
    );
  }
}

