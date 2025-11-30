import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { getAllUsers } from '@/src/services/admin';
import UsersTable from '@/components/admin/users/UsersTable';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; search?: string; subscription_status?: string };
}) {
  const user = await getAuthUser();

  if (!user || !user.isAdmin) {
    redirect('/dashboard');
  }

  const page = parseInt(searchParams.page || '1', 10);
  const limit = parseInt(searchParams.limit || '20', 10);

  const result = await getAllUsers({
    page,
    limit,
    search: searchParams.search,
    subscriptionStatus: searchParams.subscription_status,
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">User Management</h1>
      <UsersTable
        initialUsers={result.users}
        initialTotal={result.total}
        initialPage={result.page}
        initialLimit={result.limit}
      />
    </div>
  );
}

