import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';
import { getUserFlowcharts } from '@/src/services/flowchart';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import FlowchartListClient from '@/components/flowchart/FlowchartListClient';

export const dynamic = 'force-dynamic';

export default async function FlowchartListPage() {
  const user = await getAuthUser();
  
  if (!user) {
    redirect('/signin');
  }

  const flowcharts = await getUserFlowcharts(user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">My Flowcharts</h1>
        <Link href="/flowchart">
          <Button>Create New Flowchart</Button>
        </Link>
      </div>

      <FlowchartListClient initialFlowcharts={flowcharts} />
    </div>
  );
}

