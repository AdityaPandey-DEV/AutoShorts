'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface ApiKey {
  provider: string;
  masked: string;
}

export default function ApiKeysManager() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [provider, setProvider] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const response = await fetch('/api/keys');
      const data = await response.json();
      if (response.ok) {
        setKeys(data.keys || []);
      }
    } catch (error) {
      console.error('Error fetching keys:', error);
    }
  };

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, value }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to store API key');
        return;
      }

      setProvider('');
      setValue('');
      setShowAddForm(false);
      fetchKeys();
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKey = async (providerToDelete: string) => {
    if (!confirm(`Are you sure you want to delete the ${providerToDelete} API key?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/keys/${providerToDelete}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchKeys();
      }
    } catch (error) {
      console.error('Error deleting key:', error);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : 'Add API Key'}
        </Button>
      </div>

      {showAddForm && (
        <form onSubmit={handleAddKey} className="mb-6 p-4 border rounded-lg">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-4 py-2 border border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600"
              required
            >
              <option value="">Select provider</option>
              <option value="gemini">Gemini</option>
              <option value="pexels">Pexels</option>
              <option value="tts">TTS (Google Cloud)</option>
              <option value="youtube_refresh_token">YouTube (OAuth recommended)</option>
            </select>
          </div>
          <Input
            type="text"
            label="API Key"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            required
            disabled={loading}
          />
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save API Key'}
          </Button>
        </form>
      )}

      <div className="space-y-2">
        {keys.length === 0 ? (
          <p className="text-gray-600">No API keys configured yet.</p>
        ) : (
          keys.map((key) => (
            <div
              key={key.provider}
              className="flex justify-between items-center p-3 border rounded-lg"
            >
              <div>
                <span className="font-medium">{key.provider}:</span>{' '}
                <span className="text-gray-600">{key.masked}</span>
              </div>
              <Button
                variant="danger"
                onClick={() => handleDeleteKey(key.provider)}
              >
                Delete
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

