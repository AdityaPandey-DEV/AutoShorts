import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { storeApiKey, listMaskedKeys } from '@/src/services/secretStore';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const adminUser = await requireAdmin();

    // List admin API keys (stored for the authenticated admin user)
    // Admin API keys are stored with the admin user's ID
    const keys = await listMaskedKeys(adminUser.id);
    return NextResponse.json({ keys });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Log full error details for debugging
    logger.error('Error listing admin API keys:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    
    // Provide more specific error messages
    let errorMessage = 'Failed to list API keys';
    let statusCode = 500;
    
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      errorMessage = 'Database connection failed. Please check DATABASE_URL environment variable.';
      statusCode = 503;
    } else if (error.code === '42P01') {
      errorMessage = 'Database table not found. Please run database migrations.';
      statusCode = 500;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage, details: process.env.NODE_ENV === 'development' ? error.message : undefined },
      { status: statusCode }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[API Keys] Starting POST request processing');
    
    // Step 1: Authenticate admin user
    console.log('[API Keys] Step 1: Authenticating admin user...');
    const adminUser = await requireAdmin();
    console.log('[API Keys] Admin user authenticated:', { id: adminUser.id, email: adminUser.email });

    // Step 2: Parse request body
    let provider: string;
    let value: string;
    
    try {
      console.log('[API Keys] Step 2: Parsing request JSON...');
      const body = await request.json();
      provider = body.provider;
      value = body.value;
      console.log('[API Keys] Request parsed:', { provider: provider ? 'present' : 'missing', value: value ? 'present' : 'missing' });
    } catch (parseError: any) {
      console.error('[API Keys] JSON parsing error:', parseError);
      console.error('[API Keys] Raw parse error:', parseError?.toString?.());
      return NextResponse.json(
        { error: 'Invalid JSON in request body', details: parseError?.message || String(parseError) },
        { status: 400 }
      );
    }

    // Step 3: Validate required fields
    console.log('[API Keys] Step 3: Validating required fields...');
    if (!provider || !value) {
      console.error('[API Keys] Validation failed: missing provider or value');
      return NextResponse.json(
        { error: 'provider and value are required' },
        { status: 400 }
      );
    }

    // Step 4: Validate provider
    console.log('[API Keys] Step 4: Validating provider...');
    const validProviders = ['gemini', 'pexels', 'tts'];
    const normalizedProvider = provider.toLowerCase();
    if (!validProviders.includes(normalizedProvider)) {
      console.error('[API Keys] Validation failed: invalid provider', normalizedProvider);
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    // Step 5: Store API key
    console.log('[API Keys] Step 5: Storing API key...', { 
      userId: adminUser.id, 
      provider: normalizedProvider,
      valueLength: value.length 
    });
    
    try {
      await storeApiKey(adminUser.id, normalizedProvider, value);
      console.log('[API Keys] API key stored successfully');
      logger.info(`Admin API key stored for provider: ${normalizedProvider} by user ${adminUser.id}`);
      return NextResponse.json({ ok: true, message: 'API key stored successfully' });
    } catch (storeError: any) {
      console.error('[API Keys] Error in storeApiKey function:');
      console.error('[API Keys] Raw storeError:', storeError);
      console.error('[API Keys] storeError type:', storeError?.constructor?.name);
      console.error('[API Keys] storeError message:', storeError?.message);
      console.error('[API Keys] storeError toString:', storeError?.toString?.());
      console.error('[API Keys] storeError code:', storeError?.code);
      console.error('[API Keys] storeError stack:', storeError?.stack);
      throw storeError; // Re-throw to be caught by outer catch
    }
  } catch (error: any) {
    // Log raw error first - this is critical for debugging
    console.error('[API Keys] ====== ERROR CAUGHT ======');
    console.error('[API Keys] Raw error object:', error);
    console.error('[API Keys] Error type:', error?.constructor?.name || typeof error);
    console.error('[API Keys] Error message (direct):', error?.message);
    console.error('[API Keys] Error toString():', error?.toString?.());
    console.error('[API Keys] String(error):', String(error));
    console.error('[API Keys] Error code:', error?.code);
    console.error('[API Keys] Error stack:', error?.stack);
    console.error('[API Keys] Error detail:', error?.detail);
    console.error('[API Keys] Error constraint:', error?.constraint);
    console.error('[API Keys] Full error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    console.error('[API Keys] ===========================');
    
    // Also use logger
    logger.error('Error storing admin API key - Full details:', {
      rawError: error,
      errorType: error?.constructor?.name || typeof error,
      message: error?.message,
      toString: error?.toString?.(),
      code: error?.code,
      stack: error?.stack,
      detail: error?.detail,
      constraint: error?.constraint,
    });
    
    // Handle auth errors
    const errorMessageStr = error?.message || error?.toString?.() || String(error);
    if (errorMessageStr === 'Unauthorized' || errorMessageStr.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Extract error message in multiple ways
    let errorMessage = 'Failed to store API key';
    let statusCode = 500;
    
    // Try multiple ways to get error message
    const extractedMessage = error?.message || error?.toString?.() || String(error) || 'Unknown error';
    
    if (extractedMessage.includes('MASTER_KEY')) {
      errorMessage = 'Encryption key not configured. Please set MASTER_KEY environment variable.';
      statusCode = 500;
    } else if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND') {
      errorMessage = 'Database connection failed. Please check DATABASE_URL environment variable.';
      statusCode = 503;
    } else if (error?.code === '42P01') {
      errorMessage = 'Database table not found. Please run database migrations.';
      statusCode = 500;
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

