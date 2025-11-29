import { Router, Request, Response } from 'express';
import { google } from 'googleapis';
import validator from 'validator';
import pool from '../db';
import { storeApiKey } from '../services/secretStore';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password';
import { generateToken } from '../middleware/auth';
import { startTrial } from '../services/subscription';
import { logger } from '../utils/logger';

const router = Router();

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const OAUTH_REDIRECT_URI = process.env.OAUTH_REDIRECT_URI;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !OAUTH_REDIRECT_URI) {
  throw new Error('Missing required Google OAuth environment variables');
}

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  OAUTH_REDIRECT_URI
);

// Google OAuth client for user authentication (different from YouTube OAuth)
const GOOGLE_OAUTH_REDIRECT_URI = process.env.GOOGLE_OAUTH_REDIRECT_URI || process.env.OAUTH_REDIRECT_URI;
const googleOAuthClient = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_OAUTH_REDIRECT_URI
);

/**
 * POST /auth/register
 * Register a new user with email/password
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ error: passwordValidation.error });
    }

    const client = await pool.connect();
    
    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: 'User with this email already exists' });
      }

      // Hash password
      const passwordHash = await hashPassword(password);

      // Create user
      const result = await client.query(
        `INSERT INTO users (email, password_hash, email_verified, subscription_status)
         VALUES ($1, $2, $3, 'trial')
         RETURNING id, email, created_at`,
        [email.toLowerCase(), passwordHash, false]
      );

      const user = result.rows[0];

      // Start 7-day trial
      await startTrial(user.id);

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      logger.info(`New user registered: ${user.email} (ID: ${user.id})`);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          subscriptionStatus: 'trial',
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /auth/login
 * Login with email/password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const client = await pool.connect();
    
    try {
      // Find user by email
      const result = await client.query(
        'SELECT id, email, password_hash, subscription_status FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = result.rows[0];

      // Check if user has password (might be OAuth-only user)
      if (!user.password_hash) {
        return res.status(401).json({ 
          error: 'This account uses Google sign-in. Please sign in with Google.' 
        });
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      logger.info(`User logged in: ${user.email} (ID: ${user.id})`);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          subscriptionStatus: user.subscription_status,
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /auth/google
 * Initiate Google OAuth for user authentication
 */
router.get('/google', (req: Request, res: Response) => {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  const url = googleOAuthClient.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  logger.info('Generated Google OAuth URL for user authentication');
  res.redirect(url);
});

/**
 * GET /auth/google/callback
 * Handle Google OAuth callback for user authentication
 */
router.get('/google/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const error = req.query.error;

  if (error) {
    logger.error('Google OAuth error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/signin?error=oauth_failed`);
  }

  if (!code) {
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/signin?error=missing_code`);
  }

  try {
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

    // Redirect to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${token}&newUser=${isNewUser}`);
  } catch (err) {
    logger.error('Google OAuth callback error:', err);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/signin?error=oauth_failed`);
  }
});

/**
 * GET /auth/youtube
 * Initiate YouTube OAuth flow
 * Note: For production, you'll want to include userId in the state parameter
 */
router.get('/youtube', (req: Request, res: Response) => {
  const scopes = [
    'https://www.googleapis.com/auth/youtube.upload',
    'https://www.googleapis.com/auth/youtube',
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent', // Force consent screen to get refresh token
    // In production, include userId in state for security
    state: req.query.userId as string || '',
  });

  logger.info('Generated OAuth URL for YouTube');
  res.redirect(url);
});

/**
 * GET /auth/youtube/callback
 * Handle OAuth callback and store refresh token
 * Note: This should be protected or use state parameter to identify user
 */
router.get('/youtube/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const state = req.query.state as string; // userId should be in state
  const error = req.query.error;

  if (error) {
    logger.error('OAuth error:', error);
    return res.status(400).send(`OAuth error: ${error}`);
  }

  if (!code) {
    return res.status(400).send('Missing authorization code');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      logger.warn('No refresh token received. User may have already authorized.');
      return res.status(400).send('No refresh token received. Please revoke access and try again.');
    }

    // TODO: Get userId from authenticated session or state parameter
    // For now, expecting userId in state or from authenticated session
    const userId = parseInt(state, 10);
    
    if (!userId || isNaN(userId)) {
      return res.status(400).send('User ID required. Please authenticate first.');
    }

    // Store refresh token encrypted in database
    await storeApiKey(userId, 'youtube_refresh_token', tokens.refresh_token);
    
    // Optionally store access token (though it will expire)
    if (tokens.access_token) {
      logger.debug('Stored YouTube access token (temporary)');
    }

    logger.info(`Stored YouTube refresh token for user ${userId}`);
    res.send(`
      <html>
        <body>
          <h1>YouTube Connected Successfully!</h1>
          <p>Your YouTube account has been connected. You can now generate and upload Shorts.</p>
          <script>setTimeout(() => window.close(), 3000);</script>
        </body>
      </html>
    `);
  } catch (err) {
    logger.error('OAuth token exchange failed:', err);
    res.status(500).send(`OAuth exchange failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
});

export default router;

