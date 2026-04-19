import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const PUBLIC_PATHS = ['/', '/login', '/register', '/connect', '/download', '/auth/telegram/callback'];
const API_PUBLIC = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/telegram/callback', '/api/connect', '/api/free-key', '/api/download', '/api/libs/serve'];

// Sub-paths of API_PUBLIC entries are also public (e.g., /api/free-key/games)
function isApiPublic(pathname: string): boolean {
  return API_PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'));
}

// Dynamic public paths: /<registrator>/free-key
const PUBLIC_REGEX = [/^\/[^/]+\/free-key(?:\/)?$/];

const AUTH_SECRET = process.env.AUTH_SECRET;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/_next') || pathname.startsWith('/api/libs/serve')) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/')) || PUBLIC_REGEX.some(r => r.test(pathname))) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    if (isApiPublic(pathname)) {
      return NextResponse.next();
    }
    const token = request.cookies.get('wp_access')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (token) {
      try {
        const { payload } = await jwtVerify(token, new TextEncoder().encode(AUTH_SECRET!));
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-user-id', payload.userId as string);
        requestHeaders.set('x-username', payload.username as string);
        requestHeaders.set('x-user-level', String(payload.level));
        return NextResponse.next({ request: { headers: requestHeaders } });
      } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    return NextResponse.next();
  }

  if (!AUTH_SECRET) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const token = request.cookies.get('wp_access')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(AUTH_SECRET));

    const ADMIN_OWNER_ONLY = ['/admin/users', '/admin/private-dashboard'];
    const ADMIN_PLUS = ['/admin/game-settings'];

    if (pathname.includes('/admin')) {
      if (ADMIN_OWNER_ONLY.some(p => pathname === p || pathname.startsWith(p + '/')) && payload.level !== 1) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      if (ADMIN_PLUS.some(p => pathname === p || pathname.startsWith(p + '/')) && payload.level !== 1 && payload.level !== 2) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-username', payload.username as string);
    requestHeaders.set('x-user-level', String(payload.level));

    return NextResponse.next({ request: { headers: requestHeaders } });
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

