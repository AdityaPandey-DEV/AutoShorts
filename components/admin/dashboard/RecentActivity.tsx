'use client';

interface RecentUser {
  id: number;
  email: string;
  created_at: string;
}

interface RecentJob {
  id: number;
  user_email: string;
  status: string;
  created_at: string;
}

interface RecentActivityProps {
  recentUsers: RecentUser[];
  recentJobs: RecentJob[];
}

export default function RecentActivity({ recentUsers, recentJobs }: RecentActivityProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Users</h2>
        <div className="space-y-3">
          {recentUsers.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent users</p>
          ) : (
            recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Jobs</h2>
        <div className="space-y-3">
          {recentJobs.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent jobs</p>
          ) : (
            recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">{job.user_email}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(job.created_at).toLocaleDateString()} • {job.status}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

