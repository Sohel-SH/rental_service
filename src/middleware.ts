import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isAdminPath = pathname.startsWith('/admin');
  const isOwnerPath = pathname.startsWith('/owner');
  const isTenantPath = pathname.startsWith('/tenant');

  if (isAdminPath || isOwnerPath || isTenantPath) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('token');
      return response;
    }

    // Role-based route restrictions
    if (isAdminPath && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isOwnerPath && payload.role !== 'owner') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isTenantPath && payload.role !== 'tenant') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect authenticated users away from the login page
  if (pathname.startsWith('/login')) {
    const token = request.cookies.get('token')?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        if (payload.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
        if (payload.role === 'owner') {
          return NextResponse.redirect(new URL('/owner', request.url));
        }
        if (payload.role === 'tenant') {
          return NextResponse.redirect(new URL('/tenant', request.url));
        }
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/owner/:path*', '/tenant/:path*', '/login'],
};
