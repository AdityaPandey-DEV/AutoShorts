import { NextRequest, NextResponse } from 'next/server';
import validator from 'validator';
import pool from '@/src/db';
import { hashPassword, validatePasswordStrength } from '@/src/utils/password';
import { generateToken, setAuthToken } from '@/lib/auth';
import { startTrial } from '@/src/services/subscription';
import { logger } from '@/src/utils/logger';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    
    try {
      // Check if user already exists
      const existingUser = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 409 }
        );
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

      const response = NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          subscriptionStatus: 'trial',
        },
      });

      setAuthToken(token, response);
      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Registration error:', error);
    return NextResponse.json(
      {
        error: 'Registration failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

