import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import ApiKeysManager from '@/components/admin/settings/ApiKeysManager';
import PlansManager from '@/components/admin/settings/PlansManager';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const user = await getAuthUser();

  if (!user || !user.isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
      
      <div>
        <PlansManager />
      </div>

      <div>
        <ApiKeysManager />
      </div>
    </div>
  );
}

