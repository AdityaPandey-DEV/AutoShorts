import pool from '../db';
import { getPlan, SUBSCRIPTION_PLANS } from '../config/plans';
import { logger } from '../utils/logger';

export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'expired';
export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise';

const TRIAL_DAYS = 7;

/**
 * Get subscription plan details
 */
export async function getSubscriptionPlan(planName: string) {
  return getPlan(planName);
}

/**
 * Start 7-day trial for a user
 */
export async function startTrial(userId: number): Promise<void> {
  const client = await pool.connect();
  
  try {
    const trialStart = new Date();
    const trialEnd = new Date(trialStart);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

    await client.query(
      `UPDATE users 
       SET trial_started_at = $1, 
           trial_ends_at = $2, 
           subscription_status = 'trial',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [trialStart, trialEnd, userId]
    );

    logger.info(`Started 7-day trial for user ${userId}`);
  } finally {
    client.release();
  }
}

/**
 * Check if user's trial is still active
 */
export async function checkTrialStatus(userId: number): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT trial_ends_at, subscription_status 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      return false;
    }

    const user = result.rows[0];
    
    if (user.subscription_status !== 'trial') {
      return false;
    }

    if (!user.trial_ends_at) {
      return false;
    }

    const trialEnd = new Date(user.trial_ends_at);
    const now = new Date();
    
    return trialEnd > now;
  } finally {
    client.release();
  }
}

/**
 * Check if user has active subscription (trial or paid)
 */
export async function hasActiveSubscription(userId: number): Promise<boolean> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT subscription_status, trial_ends_at, subscription_ends_at 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      return false;
    }

    const user = result.rows[0];
    const now = new Date();

    // Check if trial is active
    if (user.subscription_status === 'trial' && user.trial_ends_at) {
      const trialEnd = new Date(user.trial_ends_at);
      if (trialEnd > now) {
        return true;
      }
    }

    // Check if paid subscription is active
    if (user.subscription_status === 'active') {
      if (!user.subscription_ends_at) {
        // No end date means ongoing subscription
        return true;
      }
      const subscriptionEnd = new Date(user.subscription_ends_at);
      if (subscriptionEnd > now) {
        return true;
      }
    }

    return false;
  } finally {
    client.release();
  }
}

/**
 * Upgrade or change user subscription
 */
export async function upgradeSubscription(
  userId: number,
  planName: SubscriptionPlan,
  subscriptionId?: string,
  provider?: 'stripe' | 'paypal'
): Promise<void> {
  const client = await pool.connect();
  
  try {
    const plan = getPlan(planName);
    if (!plan) {
      throw new Error(`Invalid plan: ${planName}`);
    }

    const now = new Date();
    const subscriptionStart = now;
    // Set subscription to end 30 days from now (monthly) or 365 days (yearly)
    // For now, defaulting to monthly - this should come from payment provider
    const subscriptionEnd = new Date(subscriptionStart);
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

    let updateQuery = `
      UPDATE users 
      SET subscription_plan = $1,
          subscription_status = 'active',
          subscription_starts_at = $2,
          subscription_ends_at = $3,
          updated_at = CURRENT_TIMESTAMP
    `;
    const params: any[] = [planName, subscriptionStart, subscriptionEnd];

    if (provider === 'stripe' && subscriptionId) {
      updateQuery += `, stripe_subscription_id = $${params.length + 1}`;
      params.push(subscriptionId);
    } else if (provider === 'paypal' && subscriptionId) {
      updateQuery += `, paypal_subscription_id = $${params.length + 1}`;
      params.push(subscriptionId);
    }

    updateQuery += ` WHERE id = $${params.length + 1}`;
    params.push(userId);

    await client.query(updateQuery, params);

    logger.info(`Upgraded user ${userId} to ${planName} plan`);
  } finally {
    client.release();
  }
}

/**
 * Cancel user subscription
 */
export async function cancelSubscription(userId: number): Promise<void> {
  const client = await pool.connect();
  
  try {
    await client.query(
      `UPDATE users 
       SET subscription_status = 'cancelled',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [userId]
    );

    logger.info(`Cancelled subscription for user ${userId}`);
  } finally {
    client.release();
  }
}

/**
 * Get user's current plan details
 */
export async function getUserPlan(userId: number): Promise<{
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  subscriptionEndsAt: Date | null;
}> {
  const client = await pool.connect();
  
  try {
    const result = await client.query(
      `SELECT subscription_plan, subscription_status, trial_ends_at, subscription_ends_at 
       FROM users 
       WHERE id = $1`,
      [userId]
    );

    if (!result.rows.length) {
      throw new Error(`User ${userId} not found`);
    }

    const user = result.rows[0];
    
    return {
      plan: user.subscription_plan as SubscriptionPlan | null,
      status: user.subscription_status as SubscriptionStatus,
      trialEndsAt: user.trial_ends_at ? new Date(user.trial_ends_at) : null,
      subscriptionEndsAt: user.subscription_ends_at ? new Date(user.subscription_ends_at) : null,
    };
  } finally {
    client.release();
  }
}

/**
 * Get user subscription details with plan info
 */
export async function getSubscriptionDetails(userId: number) {
  const userPlan = await getUserPlan(userId);
  const planDetails = userPlan.plan ? getPlan(userPlan.plan) : null;
  
  return {
    ...userPlan,
    planDetails,
    isTrialActive: await checkTrialStatus(userId),
    hasActiveSubscription: await hasActiveSubscription(userId),
  };
}




