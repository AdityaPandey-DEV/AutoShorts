'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Header() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch('/api/admin/auth/check')
      .then(res => res.json())
      .then(data => setIsAdmin(data.isAdmin || false))
      .catch(() => setIsAdmin(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/signin');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="bg-black shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="text-2xl font-bold text-red-600">
            AutoShorts
          </Link>
          <nav className="flex space-x-4">
            <Link href="/dashboard" className="text-white hover:text-red-500 transition-colors">
              Dashboard
            </Link>
            <Link href="/flowchart" className="text-white hover:text-red-500 transition-colors">
              Flowchart
            </Link>
            <Link href="/pricing" className="text-white hover:text-red-500 transition-colors">
              Pricing
            </Link>
            <Link href="/settings" className="text-white hover:text-red-500 transition-colors">
              Settings
            </Link>
            {isAdmin && (
              <Link href="/admin" className="text-red-600 hover:text-red-500 font-medium transition-colors">
                Admin
              </Link>
            )}
            <button
              onClick={handleLogout}
              className="text-white hover:text-red-500 transition-colors"
            >
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

