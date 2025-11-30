import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { storeApiKey, listMaskedKeys } from '@/src/services/secretStore';
import { logger } from '@/src/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { provider, value } = await request.json();

    if (!provider || !value) {
      return NextResponse.json(
        { error: 'provider and value are required' },
        { status: 400 }
      );
    }

    if (typeof provider !== 'string' || typeof value !== 'string') {
      return NextResponse.json(
        { error: 'provider and value must be strings' },
        { status: 400 }
      );
    }

    // Validate provider name
    const validProviders = ['gemini', 'pexels', 'tts', 'youtube_refresh_token'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 }
      );
    }

    await storeApiKey(user.id, provider, value);
    
    logger.info(`Stored API key for user ${user.id}, provider: ${provider}`);
    return NextResponse.json({ ok: true, message: 'API key stored successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error storing API key:', error);
    return NextResponse.json(
      {
        error: 'Failed to store API key',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();
    const keys = await listMaskedKeys(user.id);
    return NextResponse.json({ keys });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error listing API keys:', error);
    return NextResponse.json(
      {
        error: 'Failed to list API keys',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

