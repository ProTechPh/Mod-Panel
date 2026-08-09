import { NextResponse } from 'next/server';
import { resetFreeKeyDevices } from '@/lib/services/free-key-service';
import { getClientIp } from '@/lib/utils/ip';
import { withPublicApi } from '@/lib/api/with-api';
import { z } from 'zod/v4';

const schema = z.object({
  key: z.string().min(1, 'Key is required'),
});

export const POST = withPublicApi(async (request) => {
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  let deviceId = request.cookies.get('free_key_device_id')?.value;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
  }

  const ip = getClientIp(request);
  const result = await resetFreeKeyDevices(parsed.data.key, deviceId, ip);

  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
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
});
