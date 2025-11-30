import { NextResponse } from 'next/server';
import { clearAuthToken } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearAuthToken(response);
  return response;
}

