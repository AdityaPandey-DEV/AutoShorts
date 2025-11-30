import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { storeApiKey, listMaskedKeys } from '@/src/services/secretStore';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Admin user ID - this is where admin API keys are stored
// In production, you might want to use a special admin user or environment variables
const ADMIN_USER_ID = 0; // Or a dedicated admin user ID

export async function GET() {
  try {
    await requireAdmin();

    // List admin API keys (stored for admin user or use env vars)
    // For now, we'll use the first admin user or a special ID
    const keys = await listMaskedKeys(ADMIN_USER_ID);
    return NextResponse.json({ keys });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('Error listing admin API keys:', error);
    return NextResponse.json(
      { error: 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const { provider, value } = await request.json();

    if (!provider || !value) {
      return NextResponse.json(
        { error: 'provider and value are required' },
        { status: 400 }
      );
    }

    // Valid admin providers (Gemini, Pexels, TTS)
    const validProviders = ['gemini', 'pexels', 'tts'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    await storeApiKey(ADMIN_USER_ID, provider, value);
    
    logger.info(`Admin API key stored for provider: ${provider}`);
    return NextResponse.json({ ok: true, message: 'API key stored successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('Error storing admin API key:', error);
    return NextResponse.json(
      { error: 'Failed to store API key' },
      { status: 500 }
    );
  }
}

