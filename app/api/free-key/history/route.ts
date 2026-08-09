import { NextRequest, NextResponse } from 'next/server';
import { getMyFreeKeyHistory } from '@/lib/services/free-key-service';
import { extractClientIp } from '@/lib/utils/ip';

export async function GET(request: NextRequest) {
  const registrator = request.nextUrl.searchParams.get('registrator');
  if (!registrator) {
    return NextResponse.json({ error: 'Missing registrator' }, { status: 400 });
  }

  let deviceId = request.cookies.get('free_key_device_id')?.value;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
  }

  const ip = extractClientIp(request, []);
  const history = await getMyFreeKeyHistory(deviceId, ip, registrator);
  
  const response = NextResponse.json(history);
  response.cookies.set('free_key_device_id', deviceId, {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return response;
}
