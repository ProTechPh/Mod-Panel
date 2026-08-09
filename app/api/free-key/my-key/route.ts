import { NextRequest, NextResponse } from 'next/server';
import { getMyFreeKey } from '@/lib/services/free-key-service';
import { extractClientIp } from '@/lib/utils/ip';

export async function GET(request: NextRequest) {
  let deviceId = request.cookies.get('free_key_device_id')?.value;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
  }

  const registrator = request.nextUrl.searchParams.get('registrator');
  const game = request.nextUrl.searchParams.get('game');

  if (!registrator || !game) {
    return NextResponse.json({ error: 'Missing registrator or game' }, { status: 400 });
  }

  const ip = extractClientIp(request, []);
  const result = await getMyFreeKey(deviceId, ip, registrator, game);
  if ('error' in result) {
    return NextResponse.json(null);
  }

  const response = NextResponse.json(result);
  response.cookies.set('free_key_device_id', deviceId, {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return response;
}
