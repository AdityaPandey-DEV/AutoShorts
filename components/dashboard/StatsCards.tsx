import Card from '@/components/ui/Card';

interface StatsCardsProps {
  planName: string;
  planStatus: string;
  videosGenerated: number;
  limit: number | null;
  remaining: number | null;
}

export default function StatsCards({
  planName,
  planStatus,
  videosGenerated,
  limit,
  remaining,
}: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card>
        <h3 className="text-sm text-gray-600 mb-2">Subscription Plan</h3>
        <p className="text-3xl font-bold text-gray-900">{planName}</p>
        <p className="text-sm text-gray-500 mt-1">{planStatus}</p>
      </Card>
      <Card>
        <h3 className="text-sm text-gray-600 mb-2">Videos This Month</h3>
        <p className="text-3xl font-bold text-gray-900">{videosGenerated}</p>
        <p className="text-sm text-gray-500 mt-1">
          {limit ? `of ${limit}` : 'unlimited'}
        </p>
      </Card>
      <Card>
        <h3 className="text-sm text-gray-600 mb-2">Remaining Videos</h3>
        <p className="text-3xl font-bold text-gray-900">
          {remaining !== null ? remaining : '∞'}
        </p>
      </Card>
    </div>
  );
}

