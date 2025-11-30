import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getAuthUser } from '@/lib/auth';
import { getUserWithDetails } from '@/src/services/admin';
import pool from '@/src/db';
import EditUserForm from '@/components/admin/users/EditUserForm';

export const dynamic = 'force-dynamic';

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const user = await getAuthUser();

  if (!user || !user.isAdmin) {
    redirect('/dashboard');
  }

  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const userId = parseInt(resolvedParams.id, 10);
  if (isNaN(userId)) {
    notFound();
  }

  const userDetails = await getUserWithDetails(userId);
  if (!userDetails) {
    notFound();
  }

  // Get user's jobs
  const client = await pool.connect();
  let jobs: any[] = [];
  try {
    const jobsResult = await client.query(
      'SELECT id, status, prompt, created_at FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [userId]
    );
    jobs = jobsResult.rows;
  } finally {
    client.release();
  }

  const isEditMode = resolvedSearchParams.edit === 'true';

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/users"
          className="text-red-600 hover:text-red-800 mb-4 inline-block"
        >
          ← Back to Users
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">User Details</h1>
      </div>

      {isEditMode ? (
        <EditUserForm user={userDetails} />
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">User Information</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{userDetails.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Subscription Status</dt>
                <dd className="mt-1">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      userDetails.subscription_status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : userDetails.subscription_status === 'trial'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {userDetails.subscription_status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Subscription Plan</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {userDetails.subscription_plan || 'N/A'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Jobs</dt>
                <dd className="mt-1 text-sm text-gray-900">{userDetails.jobs_count}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Videos Generated</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {userDetails.total_videos_generated}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Created At</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(userDetails.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>
            <div className="mt-6">
              <Link
                href={`/admin/users/${userId}?edit=true`}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Edit User
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Jobs</h2>
            {jobs.length === 0 ? (
              <p className="text-gray-500">No jobs found</p>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <div key={job.id} className="border-b border-gray-200 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Job #{job.id}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{job.prompt.substring(0, 100)}...</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          job.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : job.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {job.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

