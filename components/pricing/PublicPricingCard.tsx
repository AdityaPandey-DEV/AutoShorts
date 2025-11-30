'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plan } from '@/src/services/plans';
import { Check } from 'lucide-react';

interface PublicPricingCardProps {
  plan: Plan;
  isPopular?: boolean;
}

export default function PublicPricingCard({ plan, isPopular = false }: PublicPricingCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    // Redirect to signup with plan preselected
    window.location.href = `/signup?plan=${plan.planName}`;
  };

  return (
    <div
      className={`relative bg-white rounded-lg shadow-lg p-8 border-2 ${
        isPopular ? 'border-red-600 transform scale-105 z-10' : 'border-gray-200'
      }`}
    >
      {isPopular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
          POPULAR
        </div>
      )}
      
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-black mb-2">{plan.displayName}</h3>
        <div className="flex items-baseline justify-center">
          <span className="text-5xl font-bold text-red-600">${plan.priceMonthly}</span>
          <span className="text-gray-600 ml-2">/month</span>
        </div>
        {plan.priceYearly && (
          <p className="text-sm text-gray-500 mt-1">
            ${plan.priceYearly}/year (save ${(plan.priceMonthly * 12 - plan.priceYearly).toFixed(0)})
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        <li className="flex items-start">
          <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
          <span className="text-gray-700">
            {plan.maxVideosPerMonth === null
              ? 'Unlimited'
              : `${plan.maxVideosPerMonth}`}{' '}
            videos per month
          </span>
        </li>
        <li className="flex items-start">
          <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
          <span className="text-gray-700">
            {plan.features.maxVideoLength}s max length
          </span>
        </li>
        <li className="flex items-start">
          <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
          <span className="text-gray-700">
            {plan.features.videoQuality.join(', ')} quality
          </span>
        </li>
        {plan.features.customBranding && (
          <li className="flex items-start">
            <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Custom branding</span>
          </li>
        )}
        {plan.features.priorityProcessing && (
          <li className="flex items-start">
            <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Priority processing</span>
          </li>
        )}
        {plan.features.apiAccess && (
          <li className="flex items-start">
            <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">API access</span>
          </li>
        )}
        {plan.features.customTTSVoices && (
          <li className="flex items-start">
            <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Custom TTS voices</span>
          </li>
        )}
        {plan.features.advancedAnalytics && (
          <li className="flex items-start">
            <Check className="w-5 h-5 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
            <span className="text-gray-700">Advanced analytics</span>
          </li>
        )}
      </ul>

      <Link
        href={`/signup?plan=${plan.planName}`}
        className={`block w-full text-center px-6 py-3 rounded-lg font-semibold transition-colors ${
          isPopular
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-black text-white hover:bg-gray-800'
        }`}
      >
        {loading ? 'Processing...' : 'Get Started'}
      </Link>
    </div>
  );
}

