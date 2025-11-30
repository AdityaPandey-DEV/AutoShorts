import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import StatsCards from '@/components/dashboard/StatsCards';
import VideoCreator from '@/components/dashboard/VideoCreator';
import JobsList from '@/components/dashboard/JobsList';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export const metadata = {
  title: 'Dashboard - AutoShorts',
  description: 'Your AutoShorts dashboard',
};

async function getDashboardData() {
  const user = await getAuthUser();
  if (!user) {
    return null;
  }

  try {
    // Import services directly instead of using API routes
    const { getSubscriptionDetails } = await import('@/src/services/subscription');
    const { getCurrentMonthUsage } = await import('@/src/services/usage');
    const pool = (await import('@/src/db')).default;

    // Fetch subscription details
    const subscription = await getSubscriptionDetails(user.id);
    
    // Fetch usage
    const usage = await getCurrentMonthUsage(user.id);
    const subscriptionDetails = await getSubscriptionDetails(user.id);
    
    const usageWithLimit = {
      currentMonth: {
        videosGenerated: usage.videosGenerated,
        limit: subscriptionDetails.planDetails?.maxVideosPerMonth,
        remaining: subscriptionDetails.planDetails?.maxVideosPerMonth 
          ? subscriptionDetails.planDetails.maxVideosPerMonth - usage.videosGenerated
          : null,
      },
    };

    // Fetch jobs
    const client = await pool.connect();
    let jobs: any[] = [];
    try {
      const result = await client.query(
        'SELECT * FROM jobs WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
        [user.id]
      );
      jobs = result.rows.map((job: any) => ({
        id: job.id,
        status: job.status,
        prompt: job.prompt,
        youtubeVideoId: job.youtube_video_id,
        errorMessage: job.error_message,
        createdAt: job.created_at,
        updatedAt: job.updated_at,
      }));
    } finally {
      client.release();
    }

    return {
      subscription,
      usage: usageWithLimit,
      jobs,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return null;
  }
}

export default async function DashboardPage() {
  const user = await getAuthUser();
  
  if (!user) {
    redirect('/signin');
  }

  const data = await getDashboardData();

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { subscription, usage, jobs } = data;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Trial Banner */}
      {subscription.status === 'trial' && subscription.trialEndsAt && (
        <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 rounded-lg mb-8 flex justify-between items-center">
          <div>
            <p className="font-semibold text-lg mb-1">🎉 Free Trial Active!</p>
            <p>
              {Math.ceil(
                (new Date(subscription.trialEndsAt).getTime() - Date.now()) /
                  (1000 * 60 * 60 * 24)
              )}{' '}
              days remaining in your trial
            </p>
          </div>
          <Link href="/pricing">
            <Button variant="secondary">Upgrade Now</Button>
          </Link>
        </div>
      )}

      {/* Stats */}
      <StatsCards
        planName={subscription.planDetails?.displayName || subscription.plan || 'Trial'}
        planStatus={subscription.status}
        videosGenerated={usage.currentMonth?.videosGenerated || 0}
        limit={usage.currentMonth?.limit ?? null}
        remaining={usage.currentMonth?.remaining ?? null}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VideoCreator />
          <JobsList jobs={jobs} />
        </div>
        <div>
          <Card>
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Link href="/flowchart" className="block">
                <Button fullWidth>Create Flowchart</Button>
              </Link>
              <Link href="/pricing" className="block">
                <Button fullWidth>Upgrade Plan</Button>
              </Link>
              <Link href="/settings" className="block">
                <Button variant="secondary" fullWidth>
                  Account Settings
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

