import { getAllPlans, Plan } from '@/src/services/plans';
import PublicHeader from '@/components/layout/PublicHeader';
import Header from '@/components/layout/Header';
import PublicPricingCard from '@/components/pricing/PublicPricingCard';
import { logger } from '@/src/utils/logger';
import { getAuthUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: 'Pricing - AutoShorts',
  description: 'Choose your AutoShorts plan and start creating viral YouTube Shorts',
};

export default async function PricingPage() {
  let plans: Plan[] = [];
  let hasError = false;

  // Check if user is authenticated to show appropriate header
  const user = await getAuthUser();

  try {
    plans = await getAllPlans(false); // Only active plans
  } catch (error: any) {
    logger.error('Error fetching plans in pricing page:', error);
    hasError = true;
    // Set plans to empty array to show fallback UI
    plans = [];
  }

  // Mark the middle plan as popular if there are 3 or more plans
  const popularIndex = plans.length >= 3 ? Math.floor(plans.length / 2) : -1;

  return (
    <div className="min-h-screen bg-black">
      {user ? <Header /> : <PublicHeader />}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Select the perfect plan for your video creation needs. All plans include a 7-day free trial.
          </p>
        </div>

        {hasError ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-2">
              Unable to load pricing plans at the moment.
            </p>
            <p className="text-gray-500 text-sm">
              Please try again later or contact support if the issue persists.
            </p>
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No pricing plans available at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {plans.map((plan, index) => (
              <PublicPricingCard
                key={plan.id}
                plan={plan}
                isPopular={index === popularIndex}
              />
            ))}
          </div>
        )}

        <div className="text-center text-sm text-gray-400 mt-8">
          <p>Secure payment powered by Stripe and PayPal</p>
          <p className="mt-2">Cancel anytime. No credit card required for trial.</p>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">How does the free trial work?</h3>
              <p className="text-gray-400">
                You get 7 days of full access to all features of your chosen plan. No credit card required to start.
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">Can I change plans later?</h3>
              <p className="text-gray-400">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div className="bg-gray-900 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-2">What happens if I exceed my video limit?</h3>
              <p className="text-gray-400">
                You'll be notified when you're approaching your limit. You can upgrade your plan or wait until the next billing cycle.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

