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
      return NextResponse.redirect(new URL('/', request.url));
    }

    const payload = await verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('token');
      return response;
    }

    // Role-based route restrictions
    if (isAdminPath && payload.role !== 'admin' && payload.role !== 'telecaller') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isOwnerPath && payload.role !== 'owner') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (isTenantPath && payload.role !== 'tenant') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Redirect /login to home modal
  if (pathname.startsWith('/login')) {
    const token = request.cookies.get('token')?.value;
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        if (payload.role === 'admin' || payload.role === 'telecaller') {
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
    return NextResponse.redirect(new URL('/?showLogin=true', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/owner/:path*', '/tenant/:path*', '/login'],
};
