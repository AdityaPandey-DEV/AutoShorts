import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import pool from '../db';
import { getPlan, SubscriptionPlan } from '../config/plans';
import { upgradeSubscription } from './subscription';
import { logger } from '../utils/logger';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || 'sandbox';

function paypalClient() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured');
  }

  const environment = PAYPAL_MODE === 'live'
    ? new checkoutNodeJssdk.core.LiveEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET)
    : new checkoutNodeJssdk.core.SandboxEnvironment(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET);

  return new checkoutNodeJssdk.core.PayPalHttpClient(environment);
}

/**
 * Create a PayPal order
 */
export async function createOrder(
  userId: number,
  planName: string,
  period: 'monthly' | 'yearly' = 'monthly'
): Promise<{ orderId: string; approvalUrl: string }> {
  const plan = getPlan(planName);
  if (!plan) {
    throw new Error(`Invalid plan: ${planName}`);
  }

  const price = period === 'yearly' ? plan.priceYearly : plan.priceMonthly;

  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: 'USD',
          value: price.toFixed(2),
        },
        description: `${plan.displayName} Plan - ${period}`,
        custom_id: `${userId}-${planName}-${period}`,
      },
    ],
    application_context: {
      brand_name: 'AutoShorts',
      landing_page: 'BILLING',
      user_action: 'PAY_NOW',
      return_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payment/paypal/success`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing?cancelled=true`,
    },
  });

  try {
    const order = await paypalClient().execute(request) as any;
    const approvalUrl = order.result.links?.find((link: any) => link.rel === 'approve')?.href;

    if (!approvalUrl) {
      throw new Error('No approval URL in PayPal response');
    }

    // Store order metadata in database for later reference
    const client = await pool.connect();
    try {
      await client.query(
        `INSERT INTO payments (user_id, amount, currency, payment_provider, payment_intent_id, status, metadata)
         VALUES ($1, $2, 'USD', 'paypal', $3, 'pending', $4)`,
        [
          userId,
          price,
          order.result.id,
          JSON.stringify({ planName, period }),
        ]
      );
    } finally {
      client.release();
    }

    return {
      orderId: order.result.id || '',
      approvalUrl,
    };
  } catch (error) {
    logger.error('PayPal order creation failed:', error);
    throw error;
  }
}

/**
 * Capture a PayPal order
 */
export async function captureOrder(orderId: string): Promise<void> {
  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});

  try {
    const capture = await paypalClient().execute(request) as any;
    
    if (capture.result.status !== 'COMPLETED') {
      throw new Error(`PayPal order not completed: ${capture.result.status}`);
    }

    // Get payment metadata from database
    const client = await pool.connect();
    let userId: number;
    let planName: string;
    let period: string;

    try {
      const result = await client.query(
        `SELECT user_id, amount, metadata FROM payments 
         WHERE payment_intent_id = $1 AND payment_provider = 'paypal'`,
        [orderId]
      );

      if (result.rows.length === 0) {
        throw new Error('Payment record not found');
      }

      const payment = result.rows[0];
      userId = payment.user_id;
      const metadata = payment.metadata || {};
      planName = metadata.planName;
      period = metadata.period;

      // Update payment status
      await client.query(
        `UPDATE payments 
         SET status = 'succeeded', updated_at = CURRENT_TIMESTAMP
         WHERE payment_intent_id = $1 AND payment_provider = 'paypal'`,
        [orderId]
      );
    } finally {
      client.release();
    }

    // Upgrade user subscription
    // Note: PayPal doesn't provide subscription ID for one-time payments
    // You may need to implement recurring subscription separately
    await upgradeSubscription(userId, planName as any);
    logger.info(`PayPal payment captured for user ${userId}, plan: ${planName}`);
  } catch (error) {
    logger.error('PayPal capture failed:', error);
    
    // Update payment status to failed
    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE payments 
         SET status = 'failed', updated_at = CURRENT_TIMESTAMP
         WHERE payment_intent_id = $1 AND payment_provider = 'paypal'`,
        [orderId]
      );
    } finally {
      client.release();
    }
    
    throw error;
  }
}

/**
 * Create a PayPal subscription (for recurring payments)
 */
export async function createSubscription(
  userId: number,
  planName: string
): Promise<{ subscriptionId: string; approvalUrl: string }> {
  const plan = getPlan(planName);
  if (!plan) {
    throw new Error(`Invalid plan: ${planName}`);
  }

  // This is a simplified version - PayPal subscriptions require more setup
  // You'll need to create billing plans and agreements
  // For now, we'll use a one-time payment approach
  
  logger.warn('PayPal subscriptions require additional setup. Using one-time payment.');
  const order = await createOrder(userId, planName, 'monthly');
  return {
    subscriptionId: order.orderId, // Use orderId as subscriptionId for one-time payments
    approvalUrl: order.approvalUrl,
  };
}

/**
 * Cancel a PayPal subscription
 */
export async function cancelPayPalSubscription(subscriptionId: string): Promise<void> {
  // PayPal subscription cancellation requires API call to cancel billing agreement
  // This is a placeholder - implement based on your PayPal subscription setup
  logger.info(`Cancelling PayPal subscription: ${subscriptionId}`);
  
  const client = await pool.connect();
  try {
    await client.query(
      `UPDATE users 
       SET subscription_status = 'cancelled'
       WHERE paypal_subscription_id = $1`,
      [subscriptionId]
    );
  } finally {
    client.release();
  }
}

