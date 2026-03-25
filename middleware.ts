import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedRoutes = [
    '/dashboard',
    '/clients',
    '/projects',
    '/payments',
    '/assets',
    '/reports',
    '/settings',
  ];

  const isProtected = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected) {
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { payload, error } = await verifyToken(accessToken, 'access');

    if (!payload) {
      if (error === 'ERR_JWT_EXPIRED') {
        // Token expired — redirect to login; client-side handles token refresh
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clients/:path*',
    '/projects/:path*',
    '/payments/:path*',
    '/assets/:path*',
    '/reports/:path*',
    '/settings/:path*',
  ],
};
