import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { checkRateLimit, getRateLimitTier } from '@/lib/rate-limit';
import { extractClientIp } from '@/lib/utils/ip';
import { isLockedOut, cleanupBruteForce } from '@/lib/auth/brute-force';

const PUBLIC_PATHS = ['/', '/login', '/register', '/connect', '/download', '/auth/telegram/callback', '/store-terms'];
const API_PUBLIC = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh', '/api/auth/telegram/callback', '/api/connect', '/api/free-key', '/api/download', '/api/libs/serve', '/api/server-status', '/api/store/webhook', '/api/store/checkout', '/api/store/orders', '/api/store/products', '/api/store'];

const TRUSTED_PROXIES = (process.env.TRUSTED_PROXIES || '').split(',').filter(Boolean);
const MAX_BODY_SIZE = 1024 * 1024;
const MAX_AUTH_BODY_SIZE = 10 * 1024;
const AUTH_SECRET = process.env.AUTH_SECRET;

// Sub-paths of API_PUBLIC entries are also public (e.g., /api/free-key/games)
function isApiPublic(pathname: string): boolean {
  return API_PUBLIC.some(p => pathname === p || pathname.startsWith(p + '/'));
}

// Dynamic public paths: /<registrator>/free-key, /<registrator>/store, /<registrator>/store/success
const PUBLIC_REGEX = [
  /^\/[^/]+\/free-key(?:\/)?$/,
  /^\/[^/]+\/store(?:\/)?$/,
  /^\/[^/]+\/store\/success(?:\/.*)?$/,
];

function addSecurityHeaders(response: NextResponse): void {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.delete('X-Powered-By');
}

function isStaticAsset(pathname: string): boolean {
  return pathname.startsWith('/_next') || /\.(jpg|jpeg|png|gif|svg|ico|webp|woff2?|ttf|eot|css|js|json|mp4|webm)$/i.test(pathname);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets — pass through with security headers
  if (isStaticAsset(pathname)) {
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // Extract client IP through trusted proxy validation
  const clientIp = extractClientIp(request, TRUSTED_PROXIES);

  // Rate limiting
  const tier = getRateLimitTier(pathname);
  const rateKey = `${clientIp}_${tier.maxRequests}_${tier.windowMs}`;
  const rateResult = checkRateLimit(rateKey, tier);
  if (!rateResult.allowed) {
    const response = NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 },
    );
    response.headers.set('Retry-After', String(Math.ceil(rateResult.retryAfterMs / 1000)));
    addSecurityHeaders(response);
    return response;
  }

  // Brute-force lockout for auth endpoints
  if (pathname === '/api/auth/login' || pathname === '/api/auth/register') {
    cleanupBruteForce();
    const lockStatus = isLockedOut(clientIp);
    if (lockStatus.locked) {
      const response = NextResponse.json(
        { error: 'Account temporarily locked due to too many failed attempts. Try again later.' },
        { status: 429 },
      );
      response.headers.set('Retry-After', String(Math.ceil(lockStatus.remainingMs / 1000)));
      addSecurityHeaders(response);
      return response;
    }
  }

  // Body size limit for mutation requests
  if (['POST', 'PUT', 'PATCH'].includes(request.method)) {
    const contentLength = request.headers.get('content-length');
    const MAX_UPLOAD_BODY_SIZE = 5 * 1024 * 1024; // 5MB — covers 3MB chunks + FormData overhead
    const maxSize =
      pathname.startsWith('/api/auth') || pathname === '/api/free-key'
        ? MAX_AUTH_BODY_SIZE
        : pathname.startsWith('/api/libs/upload')
          ? MAX_UPLOAD_BODY_SIZE
          : MAX_BODY_SIZE;
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      const response = NextResponse.json({ error: 'Request body too large' }, { status: 413 });
      addSecurityHeaders(response);
      return response;
    }
  }

  // Inject validated client IP and remove spoofable headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-client-ip', clientIp);
  requestHeaders.delete('x-forwarded-for');
  requestHeaders.delete('x-real-ip');

  // --- Route handling starts ---

  // Public pages
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/')) || PUBLIC_REGEX.some(r => r.test(pathname))) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining));
    addSecurityHeaders(response);
    return response;
  }

  // API routes
  if (pathname.startsWith('/api/')) {
    if (isApiPublic(pathname)) {
      const response = NextResponse.next({ request: { headers: requestHeaders } });
      response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining));
      addSecurityHeaders(response);
      return response;
    }

    // Protected API routes — verify JWT
    const token = request.cookies.get('wp_access')?.value;
    if (!token) {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      addSecurityHeaders(response);
      return response;
    }

    try {
      const { payload } = await jwtVerify(token, new TextEncoder().encode(AUTH_SECRET!));
      requestHeaders.set('x-user-id', payload.userId as string);
      requestHeaders.set('x-username', payload.username as string);
      requestHeaders.set('x-user-level', String(payload.level));
      const response = NextResponse.next({ request: { headers: requestHeaders } });
      response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining));
      addSecurityHeaders(response);
      return response;
    } catch {
      const response = NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      addSecurityHeaders(response);
      return response;
    }
  }

  // Protected pages — verify JWT and check roles
  if (!AUTH_SECRET) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const pageToken = request.cookies.get('wp_access')?.value;
  if (!pageToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(pageToken, new TextEncoder().encode(AUTH_SECRET));

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

    requestHeaders.set('x-user-id', payload.userId as string);
    requestHeaders.set('x-username', payload.username as string);
    requestHeaders.set('x-user-level', String(payload.level));

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set('X-RateLimit-Remaining', String(rateResult.remaining));
    addSecurityHeaders(response);
    return response;
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}