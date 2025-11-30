import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return secret;
}

export interface JWTPayload {
  userId: number;
  email?: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: number;
  email?: string;
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: number, email?: string, expiresIn: string = '7d'): string {
  const payload: JWTPayload = {
    userId,
    email,
  };
  
  return jwt.sign(payload, getJwtSecret(), { expiresIn } as jwt.SignOptions);
}

/**
 * Verify and decode JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, getJwtSecret()) as unknown as JWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Get authenticated user from request cookies
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    return null;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return null;
  }

  return {
    id: decoded.userId,
    email: decoded.email,
  };
}

/**
 * Set auth token in cookie
 */
export function setAuthToken(token: string, response: NextResponse) {
  response.cookies.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

/**
 * Clear auth token
 */
export function clearAuthToken(response: NextResponse) {
  response.cookies.delete('auth_token');
}

/**
 * Middleware helper to check authentication
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

