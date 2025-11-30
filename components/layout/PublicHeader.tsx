'use client';

import Link from 'next/link';

export default function PublicHeader() {
  return (
    <header className="bg-black shadow-sm border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-2xl font-bold text-red-600 hover:text-red-700 transition-colors">
            AutoShorts
          </Link>
          <nav className="flex space-x-6">
            <Link href="/pricing" className="text-white hover:text-red-500 transition-colors">
              Pricing
            </Link>
            <Link href="/signin" className="text-white hover:text-red-500 transition-colors">
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Start Free Trial
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

