// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME, SessionVerifyError } from '@/lib/auth';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/till',
  '/barndobucks',
  '/buzz',
  '/governance',
  '/realestate',
  '/fellowship',
  '/fellowship-admin',
  '/users',
  '/analytics',
];

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Skip API and static assets
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/static')
  ) {
    return NextResponse.next();
  }

  const needsAuth = PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', pathname + (search || ''));
    return NextResponse.redirect(url);
  }

  try {
    const session = await verifySession(token); // { userId, role, ... }

    // Block non-active users from protected routes (status is optional in SessionPayload)
    if (session.status != null && session.status !== 'active') {
      const url = new URL('/login', req.url);
      url.searchParams.set('status', session.status as string);
      const response = NextResponse.redirect(url);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    const isFellowshipAdmin =
      pathname === '/fellowship-admin' || pathname.startsWith('/fellowship-admin/');
    const isFellowship = pathname === '/fellowship' || pathname.startsWith('/fellowship/');
    const isUsers = pathname === '/users' || pathname.startsWith('/users/');

    // Admin-only areas
    if (isFellowshipAdmin || isUsers) {
      if (session.role !== 'admin') {
        const url = new URL(isFellowshipAdmin ? '/fellowship' : '/dashboard', req.url);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    // Fellow area: route admins to admin view
    if (isFellowship) {
      if (session.role === 'admin') {
        const url = new URL('/fellowship-admin', req.url);
        return NextResponse.redirect(url);
      }
      return NextResponse.next();
    }

    return NextResponse.next();
  } catch (err) {
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', pathname + (search || ''));

    if (err instanceof SessionVerifyError) {
      if (err.code === 'expired') {
        // Token expired: redirect to login with expired hint
        url.searchParams.set('expired', '1');
        return NextResponse.redirect(url);
      }
      // Malformed or invalid signature: clear the corrupt cookie
      const response = NextResponse.redirect(url);
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    // Unknown error: clear cookie to be safe
    const response = NextResponse.redirect(url);
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/till/:path*',
    '/barndobucks/:path*',
    '/buzz/:path*',
    '/governance/:path*',
    '/realestate/:path*',
    '/fellowship/:path*',
    '/fellowship-admin/:path*',
    '/users/:path*',
    '/analytics/:path*',
  ],
};
