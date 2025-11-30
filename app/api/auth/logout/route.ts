import { NextResponse } from 'next/server';
import { clearAuthToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearAuthToken(response);
  return response;
}

