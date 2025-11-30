'use client';

import { useState, useEffect } from 'react';

interface ApiKey {
  provider: string;
  masked: string;
}

export default function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    provider: '',
    value: '',
  });

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/api-keys');
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching API keys:', errorData);
        throw new Error(errorData.error || 'Failed to fetch API keys');
      }
      const data = await response.json();
      setKeys(data.keys || []);
    } catch (error) {
      console.error('Error fetching API keys:', error);
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setFormData({ provider: '', value: '' });
        fetchKeys();
      } else {
        console.error('Error saving API key:', data.error || 'Unknown error');
        alert(data.error || 'Failed to save API key');
      }
    } catch (error) {
      console.error('Error saving API key:', error);
      alert('Failed to save API key. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin API Keys</h2>
        <p className="text-sm text-gray-600 mb-6">
          These API keys are used for all users. Manage your Gemini, Pexels, and TTS service keys here.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Provider
              </label>
              <select
                value={formData.provider}
                onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                required
              >
                <option value="">Select provider</option>
                <option value="gemini">Gemini (Google AI)</option>
                <option value="pexels">Pexels</option>
                <option value="tts">TTS (Google Cloud)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Key
              </label>
              <input
                type="text"
                value={formData.value}
                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500"
                placeholder="Enter API key"
                required
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save API Key'}
          </button>
        </form>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : keys.length === 0 ? (
          <p className="text-gray-500">No API keys configured</p>
        ) : (
          <div className="space-y-2">
            {keys.map((key) => (
              <div
                key={key.provider}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-md"
              >
                <div>
                  <span className="font-medium text-gray-900 capitalize">{key.provider}</span>
                  <p className="text-sm text-gray-500 mt-1">{key.masked}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

