import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth';
import { hasActiveSubscription, getUserPlan } from '../services/subscription';
import { getCurrentMonthUsage, checkCanGenerate } from '../services/usage';
import { getPlan } from '../config/plans';
import { logger } from '../utils/logger';

/**
 * Middleware to require active subscription or trial
 */
export async function requireActiveSubscription(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    const active = await hasActiveSubscription(userId);
    
    if (!active) {
      res.status(403).json({
        error: 'Subscription required',
        message: 'Your trial has expired. Please upgrade to a paid plan to continue generating videos.',
      });
      return;
    }

    next();
  } catch (error) {
    logger.error('Error checking subscription:', error);
    res.status(500).json({
      error: 'Failed to verify subscription',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Middleware to check if user can generate videos (usage limits)
 */
export async function checkVideoLimit(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }

    // Get user's plan
    const userPlan = await getUserPlan(userId);
    const planDetails = userPlan.plan ? getPlan(userPlan.plan) : null;

    // Check if user has active subscription or trial
    const hasActive = await hasActiveSubscription(userId);
    if (!hasActive) {
      res.status(403).json({
        error: 'Subscription required',
        message: 'Your trial has expired. Please upgrade to continue.',
      });
      return;
    }

    // If no plan details (shouldn't happen), default to trial/starter limits
    const maxVideos = planDetails?.maxVideosPerMonth || 10;

    // Check usage limits
    const canGenerate = await checkCanGenerate(userId, maxVideos);

    if (!canGenerate.canGenerate) {
      res.status(403).json({
        error: 'Usage limit reached',
        message: canGenerate.reason || 'Monthly video limit reached',
        currentUsage: canGenerate.currentUsage,
        limit: canGenerate.limit,
      });
      return;
    }

    // Attach usage info to request for use in route handler
    (req as any).usageInfo = {
      currentUsage: canGenerate.currentUsage,
      limit: canGenerate.limit,
      plan: userPlan.plan,
    };

    next();
  } catch (error) {
    logger.error('Error checking video limit:', error);
    res.status(500).json({
      error: 'Failed to check usage limits',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Middleware to require a specific plan or higher
 */
export async function requirePlan(minPlan: 'starter' | 'pro' | 'enterprise') {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const userPlan = await getUserPlan(userId);

      if (!userPlan.plan) {
        res.status(403).json({
          error: 'Subscription required',
          message: `This feature requires a ${minPlan} plan or higher.`,
        });
        return;
      }

      // Check plan hierarchy
      const planHierarchy = ['starter', 'pro', 'enterprise'];
      const userPlanIndex = planHierarchy.indexOf(userPlan.plan);
      const requiredPlanIndex = planHierarchy.indexOf(minPlan);

      if (userPlanIndex < requiredPlanIndex) {
        res.status(403).json({
          error: 'Plan upgrade required',
          message: `This feature requires a ${minPlan} plan or higher. Your current plan is ${userPlan.plan}.`,
        });
        return;
      }

      next();
    } catch (error) {
      logger.error('Error checking plan:', error);
      res.status(500).json({
        error: 'Failed to verify plan',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
}

