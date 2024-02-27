import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';

export async function middleware(request: NextRequest) {
  const secret = new TextEncoder().encode(process.env.JWT_SECRET);

  const response = await fetch(
    process.env.BACKEND + '/api/auth/is-authenticated',
    {
      headers: {
        cookie: request.headers.get('cookie') ?? '',
      },
    },
  );

  if (response.status === 401) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (request.url.includes('/verify')) {
    try {
      const token = request.nextUrl.searchParams.get('token') ?? '';
      await jose.jwtVerify(token, secret, {
        issuer: process.env.DOMAIN_NAME ?? 'localhost',
      });
    } catch (err) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard',
    '/profile/:path*',
    '/messages/:path*',
    '/settings',
    '/rooms',
    '/play',
    '/verify',
  ],
};
