import { NextResponse } from 'next/server';
import type { UserLevel } from '@/types';
import { signAccessToken, signRefreshToken } from './jwt';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function setAuthCookies(
  response: NextResponse,
  userId: string,
  username: string,
  level: UserLevel
): Promise<NextResponse> {
  const accessToken = await signAccessToken(userId, username, level);
  const refreshToken = await signRefreshToken(userId);

  response.cookies.set('wp_access', accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: 6 * 60 * 60,
  });

  response.cookies.set('wp_refresh', refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: 7 * 24 * 60 * 60,
  });

  return response;
}

export function clearAuthCookies(response: NextResponse): NextResponse {
  // Use both maxAge: 0 and expires in the past for maximum browser compatibility (Vercel edge)
  const expiredDate = new Date(0);

  response.cookies.set('wp_access', '', { ...COOKIE_OPTIONS, maxAge: 0, expires: expiredDate });
  response.cookies.set('wp_refresh', '', { ...COOKIE_OPTIONS, maxAge: 0, expires: expiredDate });
  return response;
}