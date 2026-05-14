import { NextResponse } from 'next/server';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function POST() {
  const response = NextResponse.json({ success: true });
  const expiredDate = new Date(0);
  response.cookies.set('st_access', '', { ...COOKIE_OPTIONS, maxAge: 0, expires: expiredDate });
  return response;
}
