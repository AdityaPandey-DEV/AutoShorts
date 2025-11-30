import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { getSystemStats } from '@/src/services/admin';
import pool from '@/src/db';
import StatsCards from '@/components/admin/dashboard/StatsCards';
import RecentActivity from '@/components/admin/dashboard/RecentActivity';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const user = await getAuthUser();

  if (!user || !user.isAdmin) {
    redirect('/dashboard');
  }

  const stats = await getSystemStats();

  // Get recent users
  const client = await pool.connect();
  let recentUsers: any[] = [];
  let recentJobs: any[] = [];

  try {
    const usersResult = await client.query(
      'SELECT id, email, created_at FROM users ORDER BY created_at DESC LIMIT 5'
    );
    recentUsers = usersResult.rows;

    const jobsResult = await client.query(
      `SELECT j.id, u.email as user_email, j.status, j.created_at 
       FROM jobs j 
       JOIN users u ON j.user_id = u.id 
       ORDER BY j.created_at DESC LIMIT 5`
    );
    recentJobs = jobsResult.rows;
  } finally {
    client.release();
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <StatsCards stats={stats} />
      <RecentActivity recentUsers={recentUsers} recentJobs={recentJobs} />
    </div>
  );
}

