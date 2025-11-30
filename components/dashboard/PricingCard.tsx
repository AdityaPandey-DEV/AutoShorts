'use client';

import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { SubscriptionPlan } from '@/src/config/plans';

interface PricingCardProps {
  plan: SubscriptionPlan;
}

export default function PricingCard({ plan }: PricingCardProps) {
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async (provider: 'stripe' | 'paypal') => {
    setLoading(true);
    try {
      const endpoint =
        provider === 'stripe'
          ? '/api/payments/checkout/stripe'
          : '/api/payments/checkout/paypal';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planName: plan.planName, period: 'monthly' }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.url) {
          window.location.href = data.url;
        } else if (data.approvalUrl) {
          window.location.href = data.approvalUrl;
        }
      } else {
        alert(data.error || 'Failed to initiate payment');
      }
    } catch (error) {
      alert('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  const isPro = plan.planName === 'pro';

  return (
    <Card
      className={`relative ${isPro ? 'border-4 border-green-600 transform scale-105' : ''}`}
    >
      {isPro && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
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
            ${plan.priceYearly}/year (save 2 months)
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        <li className="flex items-start">
          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-gray-700">
            {plan.maxVideosPerMonth === null
              ? 'Unlimited'
              : `${plan.maxVideosPerMonth}`}{' '}
            videos per month
          </span>
        </li>
        <li className="flex items-start">
          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-gray-700">
            {plan.features.maxVideoLength}s max length
          </span>
        </li>
        <li className="flex items-start">
          <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-gray-700">
            {plan.features.videoQuality.join(', ')} quality
          </span>
        </li>
        {plan.features.customBranding && (
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">Custom branding</span>
          </li>
        )}
        {plan.features.priorityProcessing && (
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">Priority processing</span>
          </li>
        )}
        {plan.features.apiAccess && (
          <li className="flex items-start">
            <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-700">API access</span>
          </li>
        )}
      </ul>

      <Button
        fullWidth
        onClick={() => {
          const provider = confirm('Choose payment method:\n\nOK = Stripe\nCancel = PayPal')
            ? 'stripe'
            : 'paypal';
          handleSubscribe(provider);
        }}
        disabled={loading}
      >
        {loading ? 'Processing...' : 'Get Started'}
      </Button>
    </Card>
  );
}

