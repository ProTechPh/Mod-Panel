import { NextResponse } from 'next/server';
import { claimFreeKey } from '@/lib/services/free-key-service';
import { getClientIp } from '@/lib/utils/ip';
import { withPublicApi } from '@/lib/api/with-api';

export const POST = withPublicApi(async (request) => {
  const { token } = await request.json();
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  let deviceId = request.cookies.get('free_key_device_id')?.value;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
  }

  const ip = getClientIp(request);
  const result = await claimFreeKey(token, ip, deviceId);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const response = NextResponse.json({ success: true, key: result.key, game: result.game });
  response.cookies.set('free_key_device_id', deviceId, {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return response;
});
