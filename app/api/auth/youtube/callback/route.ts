import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { storeApiKey } from '@/src/services/secretStore';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getOAuth2Client() {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !OAUTH_REDIRECT_URI) {
    throw new Error('Missing required Google OAuth environment variables');
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    OAUTH_REDIRECT_URI
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

  if (error) {
    logger.error('OAuth error:', error);
    return NextResponse.redirect(`${frontendUrl}/settings?error=oauth_error`);
  }

  if (!code) {
    return NextResponse.redirect(`${frontendUrl}/settings?error=missing_code`);
  }

  try {
    const oauth2Client = getOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      logger.warn('No refresh token received. User may have already authorized.');
      return NextResponse.redirect(`${frontendUrl}/settings?error=no_refresh_token`);
    }

    const userId = parseInt(state || '0', 10);
    
    if (!userId || isNaN(userId)) {
      return NextResponse.redirect(`${frontendUrl}/settings?error=invalid_user`);
    }

    // Store refresh token encrypted in database
    await storeApiKey(userId, 'youtube_refresh_token', tokens.refresh_token);
    
    logger.info(`Stored YouTube refresh token for user ${userId}`);
    return NextResponse.redirect(`${frontendUrl}/settings?success=youtube_connected`);
  } catch (err) {
    logger.error('OAuth token exchange failed:', err);
    return NextResponse.redirect(`${frontendUrl}/settings?error=oauth_failed`);
  }
}

