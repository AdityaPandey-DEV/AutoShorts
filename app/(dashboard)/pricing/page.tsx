import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import Card from '@/components/ui/Card';
import PricingCard from '@/components/dashboard/PricingCard';
import { getAllPlans } from '@/src/config/plans';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: 'Pricing - AutoShorts',
  description: 'Choose your AutoShorts plan',
};

export default async function PricingPage() {
  const user = await getAuthUser();
  
  if (!user) {
    redirect('/signin');
  }

  const plans = getAllPlans();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
        <p className="text-xl text-gray-600">
          Select the perfect plan for your video creation needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {plans.map((plan) => (
          <PricingCard key={plan.planName} plan={plan} />
        ))}
      </div>

      <div className="text-center text-sm text-gray-500">
        <p>Secure payment powered by Stripe and PayPal</p>
      </div>
    </div>
  );
}

