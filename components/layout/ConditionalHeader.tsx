'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalHeader() {
  const pathname = usePathname();
  
  // Don't render Header on flowchart route (it has its own merged header)
  if (pathname === '/flowchart' || pathname?.startsWith('/flowchart/')) {
    return null;
  }
  
  return <Header />;
}

