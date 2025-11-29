import { Router, Request, Response } from 'express';
import express from 'express';
import pool from '../db';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { createCheckoutSession, handleWebhook, cancelStripeSubscription } from '../services/stripe';
import { createOrder, captureOrder } from '../services/paypal';
import { cancelSubscription } from '../services/subscription';
import { logger } from '../utils/logger';
import Stripe from 'stripe';

const router = Router();

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
  : null;

/**
 * POST /payments/checkout/stripe
 * Create Stripe checkout session
 */
router.post('/checkout/stripe', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { planName, period } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!planName) {
      return res.status(400).json({ error: 'planName is required' });
    }

    const session = await createCheckoutSession(
      userId,
      planName,
      period || 'monthly'
    );

    res.json({
      sessionId: session.sessionId,
      url: session.url,
    });
  } catch (error) {
    logger.error('Stripe checkout error:', error);
    res.status(500).json({
      error: 'Failed to create checkout session',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /payments/checkout/paypal
 * Create PayPal order
 */
router.post('/checkout/paypal', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { planName, period } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!planName) {
      return res.status(400).json({ error: 'planName is required' });
    }

    const order = await createOrder(
      userId,
      planName,
      period || 'monthly'
    );

    res.json({
      orderId: order.orderId,
      approvalUrl: order.approvalUrl,
    });
  } catch (error) {
    logger.error('PayPal checkout error:', error);
    res.status(500).json({
      error: 'Failed to create PayPal order',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /payments/webhook/stripe
 * Handle Stripe webhook events
 */
router.post('/webhook/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig || !STRIPE_WEBHOOK_SECRET || !stripe) {
    return res.status(400).send('Webhook configuration missing');
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    logger.error('Stripe webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  try {
    await handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    logger.error('Stripe webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /payments/paypal/success
 * Handle PayPal payment success callback
 */
router.post('/paypal/success', async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'orderId is required' });
    }

    await captureOrder(orderId);

    res.json({ success: true, message: 'Payment processed successfully' });
  } catch (error) {
    logger.error('PayPal success handler error:', error);
    res.status(500).json({
      error: 'Payment processing failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /payments/history
 * Get payment history for authenticated user
 */
router.get('/history', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

            const client = await pool.connect();

    try {
      const result = await client.query(
        `SELECT id, amount, currency, payment_provider, status, created_at
         FROM payments
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      );

      res.json({
        payments: result.rows.map((row: any) => ({
          id: row.id,
          amount: parseFloat(row.amount),
          currency: row.currency,
          provider: row.payment_provider,
          status: row.status,
          createdAt: row.created_at,
        })),
      });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    res.status(500).json({
      error: 'Failed to fetch payment history',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * POST /payments/cancel
 * Cancel user subscription
 */
router.post('/cancel', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Get user's subscription info
            const client = await pool.connect();

    try {
      const result = await client.query(
        'SELECT stripe_subscription_id, paypal_subscription_id FROM users WHERE id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const user = result.rows[0];

      // Cancel subscription with payment provider
      if (user.stripe_subscription_id) {
        await cancelStripeSubscription(user.stripe_subscription_id);
      } else if (user.paypal_subscription_id) {
        const { cancelPayPalSubscription } = require('../services/paypal');
        await cancelPayPalSubscription(user.paypal_subscription_id);
      }

      // Update database
      await cancelSubscription(userId);

      res.json({ success: true, message: 'Subscription cancelled successfully' });
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Error cancelling subscription:', error);
    res.status(500).json({
      error: 'Failed to cancel subscription',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

