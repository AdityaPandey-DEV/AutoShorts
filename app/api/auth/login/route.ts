import { NextRequest, NextResponse } from 'next/server';
import pool from '@/src/db';
import { comparePassword } from '@/src/utils/password';
import { generateToken, setAuthToken } from '@/lib/auth';
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

    const client = await pool.connect();
    
    try {
      // Find user by email
      const result = await client.query(
        'SELECT id, email, password_hash, subscription_status FROM users WHERE email = $1',
        [email.toLowerCase()]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      const user = result.rows[0];

      // Check if user has password (might be OAuth-only user)
      if (!user.password_hash) {
        return NextResponse.json(
          { error: 'This account uses Google sign-in. Please sign in with Google.' },
          { status: 401 }
        );
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password_hash);
      
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }

      // Generate JWT token
      const token = generateToken(user.id, user.email);

      logger.info(`User logged in: ${user.email} (ID: ${user.id})`);

      const response = NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          subscriptionStatus: user.subscription_status,
        },
      });

      setAuthToken(token, response);
      return response;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Login error:', error);
    return NextResponse.json(
      {
        error: 'Login failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

