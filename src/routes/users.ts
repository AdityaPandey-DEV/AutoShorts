import { Router, Response } from 'express';
import pool from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getSubscriptionDetails } from '../services/subscription';
import { getCurrentMonthUsage } from '../services/usage';
import { logger } from '../utils/logger';
import validator from 'validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /users/me
 * Get current user profile
 */
router.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const client = await pool.connect();
    
    try {
      const result = await client.query(
        `SELECT id, email, email_verified, trial_started_at, trial_ends_at,
                subscription_status, subscription_plan, subscription_starts_at, 
                subscription_ends_at, created_at
         FROM users 
         WHERE id = $1`,
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      
      res.json({
        id: user.id,
        email: user.email,
        emailVerified: user.email_verified,
        subscription: {
          status: user.subscription_status,
          plan: user.subscription_plan,
          trialEndsAt: user.trial_ends_at,
          subscriptionEndsAt: user.subscription_ends_at,
        },
        createdAt: user.created_at,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    res.status(500).json({
      error: 'Failed to fetch user profile',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * PUT /users/me
 * Update user profile
 */
router.put('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { email } = req.body;

    const client = await pool.connect();
    
    try {
      // If email is being updated, validate it
      if (email) {
        if (!validator.isEmail(email)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if email is already taken
        const existing = await client.query(
          'SELECT id FROM users WHERE email = $1 AND id != $2',
          [email.toLowerCase(), userId]
        );

        if (existing.rows.length > 0) {
          return res.status(409).json({ error: 'Email already in use' });
        }

        await client.query(
          'UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [email.toLowerCase(), userId]
        );
      }

      // Fetch updated user
      const result = await client.query(
        'SELECT id, email, email_verified, created_at FROM users WHERE id = $1',
        [userId]
      );

      res.json({
        id: result.rows[0].id,
        email: result.rows[0].email,
        emailVerified: result.rows[0].email_verified,
        createdAt: result.rows[0].created_at,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error updating user profile:', error);
    res.status(500).json({
      error: 'Failed to update user profile',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /users/me/subscription
 * Get subscription details
 */
router.get('/me/subscription', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const subscription = await getSubscriptionDetails(userId);
    
    res.json(subscription);
  } catch (error) {
    logger.error('Error fetching subscription:', error);
    res.status(500).json({
      error: 'Failed to fetch subscription details',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /users/me/usage
 * Get current month usage statistics
 */
router.get('/me/usage', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const usage = await getCurrentMonthUsage(userId);
    const subscription = await getSubscriptionDetails(userId);
    
    res.json({
      currentMonth: {
        videosGenerated: usage.videosGenerated,
        limit: subscription.planDetails?.maxVideosPerMonth,
        remaining: subscription.planDetails?.maxVideosPerMonth 
          ? subscription.planDetails.maxVideosPerMonth - usage.videosGenerated
          : null,
      },
      subscription: {
        plan: subscription.plan,
        status: subscription.status,
      },
    });
  } catch (error) {
    logger.error('Error fetching usage:', error);
    res.status(500).json({
      error: 'Failed to fetch usage statistics',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

