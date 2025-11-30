import { NextRequest, NextResponse } from 'next/server';
import pool from '@/src/db';
import { requireAuth } from '@/lib/auth';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth();

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `SELECT id, email, email_verified, trial_started_at, trial_ends_at,
                subscription_status, subscription_plan, subscription_starts_at, 
                subscription_ends_at, created_at
         FROM users 
         WHERE id = $1`,
        [user.id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }

      const userData = result.rows[0];
      
      return NextResponse.json({
        id: userData.id,
        email: userData.email,
        emailVerified: userData.email_verified,
        subscription: {
          status: userData.subscription_status,
          plan: userData.subscription_plan,
          trialEndsAt: userData.trial_ends_at,
          subscriptionEndsAt: userData.subscription_ends_at,
        },
        createdAt: userData.created_at,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error fetching user profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch user profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth();
    const { email } = await request.json();

    const client = await pool.connect();
    
    try {
      // If email is being updated, validate it
      if (email) {
        const validator = require('validator');
        if (!validator.isEmail(email)) {
          return NextResponse.json(
            { error: 'Invalid email format' },
            { status: 400 }
          );
        }

        // Check if email is already taken
        const existing = await client.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email.toLowerCase(), user.id]
        );

        if (existing.rows.length > 0) {
          return NextResponse.json(
            { error: 'Email already in use' },
            { status: 409 }
          );
        }

        await client.query(
          'UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [email.toLowerCase(), user.id]
        );
      }

      // Fetch updated user
      const result = await client.query(
        'SELECT id, email, email_verified, created_at FROM users WHERE id = $1',
        [user.id]
      );

      return NextResponse.json({
        id: result.rows[0].id,
        email: result.rows[0].email,
        emailVerified: result.rows[0].email_verified,
        createdAt: result.rows[0].created_at,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    logger.error('Error updating user profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to update user profile',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

