'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export default function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-black shadow-sm border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-red-600 hover:text-red-700 transition-colors flex items-center">
            <span className="text-red-600">Auto</span><span className="text-white">Shorts</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6 items-center h-full">
            <Link href="/pricing" className="text-white hover:text-red-500 transition-colors flex items-center h-full py-2">
              Pricing
            </Link>
            <Link href="/signin" className="text-white hover:text-red-500 transition-colors flex items-center h-full py-2">
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center"
            >
              Start Free Trial
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white hover:text-red-500 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-4">
            <Link 
              href="/pricing" 
              className="block text-white hover:text-red-500 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <Link 
              href="/signin" 
              className="block text-white hover:text-red-500 transition-colors py-2"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className="block bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start Free Trial
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}

