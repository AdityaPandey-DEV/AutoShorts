import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { deleteApiKey } from '@/src/services/secretStore';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const user = await requireAuth();
    const { provider } = await params;

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider is required' },
        { status: 400 }
      );
    }

    await deleteApiKey(user.id, provider);
    
    logger.info(`Deleted API key for user ${user.id}, provider: ${provider}`);
    return NextResponse.json({ ok: true, message: 'API key deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error deleting API key:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete API key',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

