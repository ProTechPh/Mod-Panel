import { NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/auth/cookies';
import { withPublicApi } from '@/lib/api/with-api';

export const POST = withPublicApi(async () => {
  const response = NextResponse.json({ success: true });
  return clearAuthCookies(response);
});
