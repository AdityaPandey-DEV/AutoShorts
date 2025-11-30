'use client';

interface StatsCardsProps {
  stats: {
    totalUsers: number;
    usersThisMonth: number;
    activeUsers: number;
    totalJobs: number;
    jobsThisMonth: number;
    totalRevenue: number;
    revenueThisMonth: number;
    totalVideosGenerated: number;
  };
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      change: `+${stats.usersThisMonth} this month`,
      icon: '👥',
      color: 'bg-blue-500',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      change: 'Currently active',
      icon: '✅',
      color: 'bg-green-500',
    },
    {
      title: 'Total Jobs',
      value: stats.totalJobs,
      change: `+${stats.jobsThisMonth} this month`,
      icon: '📊',
      color: 'bg-red-500',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.totalRevenue.toFixed(2)}`,
      change: `$${stats.revenueThisMonth.toFixed(2)} this month`,
      icon: '💰',
      color: 'bg-yellow-500',
    },
    {
      title: 'Videos Generated',
      value: stats.totalVideosGenerated,
      change: 'All time',
      icon: '🎬',
      color: 'bg-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.change}</p>
            </div>
            <div className={`${card.color} w-12 h-12 rounded-full flex items-center justify-center text-2xl`}>
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

