import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Allow API routes and static files
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/static/')
  ) {
    return NextResponse.next();
  }

  // Protect admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    try {
      // This is a workaround since cookies() can't be used directly in middleware
      // The actual admin check will be done in the admin layout/page
      const authToken = request.cookies.get('auth_token')?.value;
      
      if (!authToken) {
        return NextResponse.redirect(new URL('/signin?redirect=/admin', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/signin?redirect=/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

