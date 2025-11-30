import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { getSystemStats } from '@/src/services/admin';

export const dynamic = 'force-dynamic';

export default async function AdminStatsPage() {
  const user = await getAuthUser();

  if (!user || !user.isAdmin) {
    redirect('/dashboard');
  }

  const stats = await getSystemStats();

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">System Statistics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
          <p className="text-sm text-gray-500 mt-1">+{stats.usersThisMonth} this month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active Users</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.activeUsers}</p>
          <p className="text-sm text-gray-500 mt-1">Currently active</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Jobs</h3>
          <p className="text-3xl font-bold text-gray-900">{stats.totalJobs}</p>
          <p className="text-sm text-gray-500 mt-1">+{stats.jobsThisMonth} this month</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">${stats.revenueThisMonth.toFixed(2)} this month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Jobs by Status</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Pending</span>
              <span className="font-semibold text-gray-900">{stats.jobsByStatus.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Processing</span>
              <span className="font-semibold text-gray-900">{stats.jobsByStatus.processing}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Completed</span>
              <span className="font-semibold text-green-600">{stats.jobsByStatus.completed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Failed</span>
              <span className="font-semibold text-red-600">{stats.jobsByStatus.failed}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Breakdown</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Trial</span>
              <span className="font-semibold text-gray-900">{stats.subscriptionBreakdown.trial}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Active</span>
              <span className="font-semibold text-green-600">{stats.subscriptionBreakdown.active}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Cancelled</span>
              <span className="font-semibold text-yellow-600">{stats.subscriptionBreakdown.cancelled}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Expired</span>
              <span className="font-semibold text-red-600">{stats.subscriptionBreakdown.expired}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Usage Statistics</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Total Videos Generated</span>
              <span className="font-semibold text-gray-900">{stats.totalVideosGenerated}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Average per User</span>
              <span className="font-semibold text-gray-900">
                {stats.averageVideosPerUser.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

