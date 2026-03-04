// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { verifySession, COOKIE_NAME } from '@/lib/auth';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/till',
  '/barndobucks',
  '/buzz',
  '/governance',
  '/realestate',
  '/fellowship',
  '/fellowship-admin',
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

    const isFellowshipAdmin =
      pathname === '/fellowship-admin' || pathname.startsWith('/fellowship-admin/');
    const isFellowship = pathname === '/fellowship' || pathname.startsWith('/fellowship/');

    // Admin area: only admins allowed
    if (isFellowshipAdmin) {
      if (session.role !== 'admin') {
        const url = new URL('/fellowship', req.url);
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
  } catch {
    const url = new URL('/login', req.url);
    url.searchParams.set('redirect', pathname + (search || ''));
    return NextResponse.redirect(url);
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
  ],
};
