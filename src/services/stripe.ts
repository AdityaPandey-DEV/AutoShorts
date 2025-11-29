import Stripe from 'stripe';
import pool from '../db';
import { getPlan, SubscriptionPlan } from '../config/plans';
import { upgradeSubscription } from './subscription';
import { logger } from '../utils/logger';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY) {
  logger.warn('STRIPE_SECRET_KEY not set - Stripe integration will not work');
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
}) : null;

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(
  userId: number,
  planName: string,
  period: 'monthly' | 'yearly' = 'monthly'
): Promise<{ sessionId: string; url: string }> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const plan = getPlan(planName);
  if (!plan) {
    throw new Error(`Invalid plan: ${planName}`);
  }

  // Get user email from database
  const client = await pool.connect();
  let userEmail: string;
  
  try {
    const result = await client.query('SELECT email FROM users WHERE id = $1', [userId]);
    if (!result.rows.length) {
      throw new Error('User not found');
    }
    userEmail = result.rows[0].email;
  } finally {
    client.release();
  }

  const price = period === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  const priceId = process.env[`STRIPE_PRICE_ID_${planName.toUpperCase()}_${period.toUpperCase()}`];

  if (!priceId) {
    throw new Error(`Stripe price ID not configured for ${planName} ${period}`);
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: userEmail,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing?cancelled=true`,
    metadata: {
      userId: userId.toString(),
      planName,
      period,
    },
    subscription_data: {
      metadata: {
        userId: userId.toString(),
        planName,
      },
    },
  });

  return {
    sessionId: session.id,
    url: session.url || '',
  };
}

/**
 * Handle Stripe webhook events
 */
export async function handleWebhook(event: Stripe.Event): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  logger.info(`Processing Stripe webhook: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancelled(subscription);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentSucceeded(invoice);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }

    default:
      logger.debug(`Unhandled Stripe event type: ${event.type}`);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const userId = parseInt(session.metadata?.userId || '0', 10);
  const planName = session.metadata?.planName || '';
  const subscriptionId = session.subscription as string;

  if (!userId || !planName) {
    logger.error('Missing metadata in checkout session:', session.id);
    return;
  }

  // Create payment record
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO payments (user_id, amount, currency, payment_provider, subscription_id, status)
       VALUES ($1, $2, $3, 'stripe', $4, 'succeeded')`,
      [userId, session.amount_total ? session.amount_total / 100 : 0, session.currency?.toUpperCase() || 'USD', subscriptionId]
    );
  } finally {
    client.release();
  }

  // Upgrade user subscription
  await upgradeSubscription(userId, planName as any, subscriptionId, 'stripe');
  logger.info(`Subscription activated for user ${userId}, plan: ${planName}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const userId = parseInt(subscription.metadata?.userId || '0', 10);
  const planName = subscription.metadata?.planName || '';

  if (!userId || !planName) {
    return;
  }

  // Update subscription end date based on current period
  const subscriptionEnd = new Date(subscription.current_period_end * 1000);
  
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE users 
       SET subscription_ends_at = $1, 
           subscription_status = $2,
           stripe_subscription_id = $3
       WHERE id = $4`,
      [subscriptionEnd, 'active', subscription.id, userId]
    );
  } finally {
    client.release();
  }
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription): Promise<void> {
  const userId = parseInt(subscription.metadata?.userId || '0', 10);

  if (!userId) {
    return;
  }

  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE users 
       SET subscription_status = 'cancelled'
       WHERE id = $1 AND stripe_subscription_id = $2`,
      [userId, subscription.id]
    );
  } finally {
    client.release();
  }

  logger.info(`Subscription cancelled for user ${userId}`);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) {
    return;
  }

  // Get user from subscription
  const client = await pool.connect();
  try {
    const result = await client.query(
      'SELECT id FROM users WHERE stripe_subscription_id = $1',
      [subscriptionId]
    );

    if (result.rows.length > 0) {
      const userId = result.rows[0].id;
      
      // Create payment record
      await client.query(
        `INSERT INTO payments (user_id, amount, currency, payment_provider, subscription_id, payment_intent_id, status)
         VALUES ($1, $2, $3, 'stripe', $4, $5, 'succeeded')`,
        [
          userId,
          invoice.amount_paid / 100,
          invoice.currency.toUpperCase(),
          subscriptionId,
          invoice.payment_intent as string,
        ]
      );
    }
  } finally {
    client.release();
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  
  if (!subscriptionId) {
    return;
  }

  logger.warn(`Payment failed for subscription ${subscriptionId}`);
  
  // You might want to send an email or update subscription status here
}

/**
 * Cancel a Stripe subscription
 */
export async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  await stripe.subscriptions.cancel(subscriptionId);
  logger.info(`Cancelled Stripe subscription: ${subscriptionId}`);
}

