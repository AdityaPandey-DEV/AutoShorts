'use client';

import { useState, useEffect } from 'react';
import { Plan, PlanFeatures } from '@/src/services/plans';
import { X, Edit, Trash2, Plus, Check } from 'lucide-react';

const defaultFeatures: PlanFeatures = {
  maxVideoLength: 30,
  videoQuality: ['720p'],
  customBranding: false,
  priorityProcessing: false,
  apiAccess: false,
  customTTSVoices: false,
  advancedAnalytics: false,
};

export default function PlansManager() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    planName: '',
    displayName: '',
    priceMonthly: '',
    priceYearly: '',
    maxVideosPerMonth: '',
    maxVideoLengthSeconds: '30',
    isActive: true,
    features: defaultFeatures,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/plans?include_inactive=true');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      alert('Failed to fetch plans');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPlan(null);
    setFormData({
      planName: '',
      displayName: '',
      priceMonthly: '',
      priceYearly: '',
      maxVideosPerMonth: '',
      maxVideoLengthSeconds: '30',
      isActive: true,
      features: defaultFeatures,
    });
    setShowModal(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      planName: plan.planName,
      displayName: plan.displayName,
      priceMonthly: plan.priceMonthly.toString(),
      priceYearly: plan.priceYearly?.toString() || '',
      maxVideosPerMonth: plan.maxVideosPerMonth?.toString() || '',
      maxVideoLengthSeconds: plan.maxVideoLengthSeconds.toString(),
      isActive: plan.isActive,
      features: plan.features,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this plan? This will deactivate it.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/plans/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchPlans();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      alert('Failed to delete plan');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        planName: formData.planName,
        displayName: formData.displayName,
        priceMonthly: parseFloat(formData.priceMonthly),
        priceYearly: formData.priceYearly ? parseFloat(formData.priceYearly) : null,
        maxVideosPerMonth: formData.maxVideosPerMonth ? parseInt(formData.maxVideosPerMonth, 10) : null,
        maxVideoLengthSeconds: parseInt(formData.maxVideoLengthSeconds, 10),
        isActive: formData.isActive,
        features: formData.features,
      };

      const url = editingPlan
        ? `/api/admin/plans/${editingPlan.id}`
        : '/api/admin/plans';
      const method = editingPlan ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setShowModal(false);
        fetchPlans();
      } else {
        const data = await response.json();
        alert(data.error || `Failed to ${editingPlan ? 'update' : 'create'} plan`);
      }
    } catch (error) {
      console.error(`Error ${editingPlan ? 'updating' : 'creating'} plan:`, error);
      alert(`Failed to ${editingPlan ? 'update' : 'create'} plan`);
    } finally {
      setSaving(false);
    }
  };

  const updateFeature = (key: keyof PlanFeatures, value: any) => {
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [key]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Subscription Plans</h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage pricing plans that users can subscribe to
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Plan
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No plans found. Create your first plan!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Videos/Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{plan.displayName}</div>
                      <div className="text-sm text-gray-500">{plan.planName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">${plan.priceMonthly}/mo</div>
                      {plan.priceYearly && (
                        <div className="text-sm text-gray-500">${plan.priceYearly}/yr</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.maxVideosPerMonth === null ? 'Unlimited' : plan.maxVideosPerMonth}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          plan.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="text-red-600 hover:text-red-900 mr-4"
                      >
                        <Edit className="w-4 h-4 inline" />
                      </button>
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4 inline" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                {editingPlan ? 'Edit Plan' : 'Create Plan'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Plan Name (slug) *
                  </label>
                  <input
                    type="text"
                    value={formData.planName}
                    onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    required
                    disabled={!!editingPlan}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.priceMonthly}
                    onChange={(e) => setFormData({ ...formData, priceMonthly: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yearly Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.priceYearly}
                    onChange={(e) => setFormData({ ...formData, priceYearly: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Videos/Month (leave empty for unlimited)
                  </label>
                  <input
                    type="number"
                    value={formData.maxVideosPerMonth}
                    onChange={(e) => setFormData({ ...formData, maxVideosPerMonth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Video Length (seconds) *
                  </label>
                  <input
                    type="number"
                    value={formData.maxVideoLengthSeconds}
                    onChange={(e) => setFormData({ ...formData, maxVideoLengthSeconds: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Features
                </label>
                <div className="space-y-2 border border-gray-300 rounded-md p-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">
                      Video Quality (comma-separated, e.g., 720p, 1080p)
                    </label>
                    <input
                      type="text"
                      value={formData.features.videoQuality.join(', ')}
                      onChange={(e) =>
                        updateFeature(
                          'videoQuality',
                          e.target.value.split(',').map((q) => q.trim())
                        )
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.features.customBranding}
                        onChange={(e) => updateFeature('customBranding', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Custom Branding</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.features.priorityProcessing}
                        onChange={(e) => updateFeature('priorityProcessing', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Priority Processing</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.features.apiAccess}
                        onChange={(e) => updateFeature('apiAccess', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">API Access</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.features.customTTSVoices}
                        onChange={(e) => updateFeature('customTTSVoices', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Custom TTS Voices</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.features.advancedAnalytics}
                        onChange={(e) => updateFeature('advancedAnalytics', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">Advanced Analytics</span>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Active (visible to users)</span>
                </label>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingPlan ? 'Update Plan' : 'Create Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

