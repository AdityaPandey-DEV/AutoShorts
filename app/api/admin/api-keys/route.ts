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
    
    logger.error('Error listing admin API keys:', error);
    return NextResponse.json(
      { error: 'Failed to list API keys', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await requireAdmin();

    const { provider, value } = await request.json();

    if (!provider || !value) {
      return NextResponse.json(
        { error: 'provider and value are required' },
        { status: 400 }
      );
    }

    // Valid admin providers (Gemini, Pexels, TTS)
    const validProviders = ['gemini', 'pexels', 'tts'];
    if (!validProviders.includes(provider.toLowerCase())) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    // Store API key with the authenticated admin user's ID
    await storeApiKey(adminUser.id, provider.toLowerCase(), value);
    
    logger.info(`Admin API key stored for provider: ${provider} by user ${adminUser.id}`);
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
      { error: 'Failed to store API key', details: error.message },
      { status: 500 }
    );
  }
}

