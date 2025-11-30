import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { getAllJobs } from '@/src/services/admin';
import JobsTable from '@/components/admin/jobs/JobsTable';

export const dynamic = 'force-dynamic';

export default async function AdminJobsPage({
  searchParams,
}: {
  searchParams: { page?: string; limit?: string; status?: string };
}) {
  const user = await getAuthUser();

  if (!user || !user.isAdmin) {
    redirect('/dashboard');
  }

  const page = parseInt(searchParams.page || '1', 10);
  const limit = parseInt(searchParams.limit || '20', 10);

  const result = await getAllJobs({
    page,
    limit,
    status: searchParams.status,
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Jobs Management</h1>
      <JobsTable
        initialJobs={result.jobs}
        initialTotal={result.total}
        initialPage={result.page}
        initialLimit={result.limit}
      />
    </div>
  );
}

