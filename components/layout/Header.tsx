'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="text-2xl font-bold text-purple-600">
            AutoShorts
          </Link>
          <nav className="flex space-x-4">
            <Link href="/dashboard" className="text-gray-700 hover:text-purple-600">
              Dashboard
            </Link>
            <Link href="/pricing" className="text-gray-700 hover:text-purple-600">
              Pricing
            </Link>
            <Link href="/settings" className="text-gray-700 hover:text-purple-600">
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-700 hover:text-purple-600"
            >
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

