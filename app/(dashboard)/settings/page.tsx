import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import Card from '@/components/ui/Card';
import SettingsForm from '@/components/dashboard/SettingsForm';
import ApiKeysManager from '@/components/dashboard/ApiKeysManager';
import Button from '@/components/ui/Button';

export const metadata = {
  title: 'Settings - AutoShorts',
  description: 'Manage your AutoShorts account settings',
};

async function getSettingsData() {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  try {
    const pool = (await import('@/src/db')).default;
    const { getSubscriptionDetails } = await import('@/src/services/subscription');

    // Fetch user data
    const client = await pool.connect();
    let userData: any;
    try {
      const result = await client.query(
        'SELECT id, email, email_verified, created_at FROM users WHERE id = $1',
        [user.id]
      );
      userData = {
        id: result.rows[0].id,
        email: result.rows[0].email,
        emailVerified: result.rows[0].email_verified,
        createdAt: result.rows[0].created_at,
      };
    } finally {
      client.release();
    }

    // Fetch subscription
    const subscription = await getSubscriptionDetails(user.id);

    return { user: userData, subscription };
  } catch (error) {
    console.error('Error fetching settings data:', error);
    return null;
  }
}

export default async function SettingsPage() {
  const user = await getAuthUser();
  
  if (!user) {
    redirect('/signin');
  }

  const data = await getSettingsData();

  if (!data) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

      <div className="space-y-6">
        <Card>
          <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
          <SettingsForm initialEmail={data.user.email} />
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">Subscription</h2>
          <div className="space-y-2">
            <p>
              <strong>Plan:</strong>{' '}
              {data.subscription.planDetails?.displayName ||
                data.subscription.plan ||
                'Trial'}
            </p>
            <p>
              <strong>Status:</strong> {data.subscription.status || 'N/A'}
            </p>
            <div className="mt-4">
              <a href="/pricing">
                <Button>Manage Subscription</Button>
              </a>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold mb-4">API Keys</h2>
          <p className="text-gray-600 mb-4">
            Manage your API keys for video generation services
          </p>
          <ApiKeysManager />
        </Card>
      </div>
    </div>
  );
}

