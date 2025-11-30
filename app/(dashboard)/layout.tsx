import Header from '@/components/layout/Header';
import { redirect } from 'next/navigation';
import { getAuthUser } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getAuthUser();
  
  if (!user) {
    redirect('/signin');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>{children}</main>
    </div>
  );
}

