import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getUserWithDetails, updateUserSubscription, deleteUser } from '@/src/services/admin';
import pool from '@/src/db';
import { logger } from '@/src/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const user = await getUserWithDetails(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, subscriptionStatus, subscriptionPlan, subscriptionEndsAt, trialEndsAt } = body;

    const client = await pool.connect();
    try {
      // Update email if provided
      if (email) {
        await client.query(
          'UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [email.toLowerCase(), userId]
        );
      }

      // Update subscription if provided
      if (subscriptionStatus || subscriptionPlan !== undefined || subscriptionEndsAt !== undefined || trialEndsAt !== undefined) {
        await updateUserSubscription(userId, {
          subscriptionStatus,
          subscriptionPlan,
          subscriptionEndsAt: subscriptionEndsAt ? new Date(subscriptionEndsAt) : undefined,
          trialEndsAt: trialEndsAt ? new Date(trialEndsAt) : undefined,
        });
      }

      const updatedUser = await getUserWithDetails(userId);
      return NextResponse.json(updatedUser);
    } finally {
      client.release();
    }
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();

    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    await deleteUser(userId);
    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    if (error.message === 'Unauthorized' || error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    logger.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

