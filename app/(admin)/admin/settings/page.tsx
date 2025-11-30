import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import ApiKeysManager from '@/components/admin/settings/ApiKeysManager';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  const user = await getAuthUser();

  if (!user || !user.isAdmin) {
    redirect('/dashboard');
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Settings</h1>
      <ApiKeysManager />
    </div>
  );
}

