export interface PlanFeatures {
  maxVideoLength: number;
  videoQuality: string[];
  customBranding: boolean;
  priorityProcessing: boolean;
  apiAccess: boolean;
  customTTSVoices: boolean;
  advancedAnalytics: boolean;
}

export interface SubscriptionPlan {
  planName: string;
  displayName: string;
  priceMonthly: number;
  priceYearly: number;
  maxVideosPerMonth: number | null; // null means unlimited
  maxVideosPerDay?: number | null; // Daily limit (for trial users)
  features: PlanFeatures;
}

// Trial configuration
export const TRIAL_CONFIG = {
  maxVideosPerDay: 5,
  durationDays: 7,
};

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  starter: {
    planName: 'starter',
    displayName: 'Starter',
    priceMonthly: 9,
    priceYearly: 90, // 2 months free
    maxVideosPerMonth: 10,
    features: {
      maxVideoLength: 30,
      videoQuality: ['720p'],
      customBranding: false,
      priorityProcessing: false,
      apiAccess: false,
      customTTSVoices: false,
      advancedAnalytics: false,
    },
  },
  pro: {
    planName: 'pro',
    displayName: 'Pro',
    priceMonthly: 29,
    priceYearly: 290, // 2 months free
    maxVideosPerMonth: 50,
    features: {
      maxVideoLength: 60,
      videoQuality: ['720p', '1080p'],
      customBranding: true,
      priorityProcessing: false,
      apiAccess: false,
      customTTSVoices: true,
      advancedAnalytics: true,
    },
  },
  enterprise: {
    planName: 'enterprise',
    displayName: 'Enterprise',
    priceMonthly: 99,
    priceYearly: 990, // 2 months free
    maxVideosPerMonth: null, // unlimited
    features: {
      maxVideoLength: 60,
      videoQuality: ['720p', '1080p', '4K'],
      customBranding: true,
      priorityProcessing: true,
      apiAccess: true,
      customTTSVoices: true,
      advancedAnalytics: true,
    },
  },
};

/**
 * Get plan by name
 */
export function getPlan(planName: string): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS[planName.toLowerCase()] || null;
}

/**
 * Get all active plans
 */
export function getAllPlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS);
}

/**
 * Compare plans to determine if plan1 has access to plan2's features
 */
export function hasPlanAccess(userPlan: string, requiredPlan: string): boolean {
  const planHierarchy = ['starter', 'pro', 'enterprise'];
  const userIndex = planHierarchy.indexOf(userPlan.toLowerCase());
  const requiredIndex = planHierarchy.indexOf(requiredPlan.toLowerCase());
  
  if (userIndex === -1 || requiredIndex === -1) return false;
  
  return userIndex >= requiredIndex;
}




