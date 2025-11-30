import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import pool from '@/src/db';
import { startTrial } from '@/src/services/subscription';
import { generateToken, setAuthToken } from '@/lib/auth';
import { logger } from '@/src/utils/logger';

function getGoogleOAuthClient() {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  const GOOGLE_OAUTH_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || process.env.OAUTH_REDIRECT_URI;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_OAUTH_REDIRECT_URI) {
    throw new Error('Missing required Google OAuth environment variables');
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_OAUTH_REDIRECT_URI
  );
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  const frontendUrl = process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

  if (error) {
    logger.error('Google OAuth error:', error);
    return NextResponse.redirect(`${frontendUrl}/signin?error=oauth_failed`);
  }

  if (!code) {
    return NextResponse.redirect(`${frontendUrl}/signin?error=missing_code`);
  }

  try {
    const googleOAuthClient = getGoogleOAuthClient();
    const { tokens } = await googleOAuthClient.getToken(code);
    googleOAuthClient.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: 'v2', auth: googleOAuthClient });
    const { data } = await oauth2.userinfo.get();

    if (!data.email || !data.id) {
      throw new Error('Missing email or ID from Google');
    }

    const client = await pool.connect();
    let userId: number;
    let isNewUser = false;

    try {
      // Check if user exists by Google ID
      let result = await client.query(
        'SELECT id, email FROM users WHERE google_id = $1',
        [data.id]
      );

      if (result.rows.length > 0) {
        // Existing user
        userId = result.rows[0].id;
        logger.info(`Google login: Existing user ${userId}`);
      } else {
        // Check if user exists by email
        result = await client.query(
          'SELECT id, email FROM users WHERE email = $1',
          [data.email.toLowerCase()]
        );

        if (result.rows.length > 0) {
          // Link Google account to existing email account
          userId = result.rows[0].id;
          await client.query(
            'UPDATE users SET google_id = $1 WHERE id = $2',
            [data.id, userId]
          );
          logger.info(`Linked Google account to existing user ${userId}`);
        } else {
          // New user - create account
          result = await client.query(
            `INSERT INTO users (email, google_id, email_verified, subscription_status)
             VALUES ($1, $2, $3, 'trial')
             RETURNING id`,
            [data.email.toLowerCase(), data.id, true]
          );
          userId = result.rows[0].id;
          isNewUser = true;
          logger.info(`New Google user registered: ${data.email} (ID: ${userId})`);

          // Start 7-day trial
          await startTrial(userId);
        }
      }
    } finally {
      client.release();
    }

    // Generate JWT token
    const token = generateToken(userId, data.email);

    // Redirect to frontend with token in cookie
    const response = NextResponse.redirect(`${frontendUrl}/dashboard`);
    setAuthToken(token, response);
    return response;
  } catch (err) {
    logger.error('Google OAuth callback error:', err);
    return NextResponse.redirect(`${frontendUrl}/signin?error=oauth_failed`);
  }
}

