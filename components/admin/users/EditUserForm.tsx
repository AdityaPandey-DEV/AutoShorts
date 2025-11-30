'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  subscription_status: string;
  subscription_plan: string | null;
  trial_ends_at: string | Date | null;
  subscription_ends_at: string | Date | null;
}

export default function EditUserForm({ user }: { user: User }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: user.email,
    subscription_status: user.subscription_status,
    subscription_plan: user.subscription_plan || '',
    subscription_ends_at: user.subscription_ends_at
      ? new Date(user.subscription_ends_at).toISOString().split('T')[0]
      : '',
    trial_ends_at: user.trial_ends_at
      ? new Date(user.trial_ends_at).toISOString().split('T')[0]
      : '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          subscriptionStatus: formData.subscription_status,
          subscriptionPlan: formData.subscription_plan || null,
          subscriptionEndsAt: formData.subscription_ends_at || null,
          trialEndsAt: formData.trial_ends_at || null,
        }),
      });

      if (response.ok) {
        router.push(`/admin/users/${user.id}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const response = await fetch(`/api/admin/users/${user.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subscription Status
          </label>
          <select
            value={formData.subscription_status}
            onChange={(e) =>
              setFormData({ ...formData, subscription_status: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          >
            <option value="trial">Trial</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subscription Plan
          </label>
          <select
            value={formData.subscription_plan}
            onChange={(e) =>
              setFormData({ ...formData, subscription_plan: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          >
            <option value="">None</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="enterprise">Enterprise</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Trial Ends At
          </label>
          <input
            type="date"
            value={formData.trial_ends_at}
            onChange={(e) =>
              setFormData({ ...formData, trial_ends_at: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subscription Ends At
          </label>
          <input
            type="date"
            value={formData.subscription_ends_at}
            onChange={(e) =>
              setFormData({ ...formData, subscription_ends_at: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          {formData.subscription_status === 'active' && (
            <button
              type="button"
              onClick={handleCancelSubscription}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

