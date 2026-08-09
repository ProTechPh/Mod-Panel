import { NextResponse } from 'next/server';
import { generateFreeKey } from '@/lib/services/free-key-service';
import { getClientIp } from '@/lib/utils/ip';
import { withPublicApi } from '@/lib/api/with-api';
import { z } from 'zod/v4';

const freeKeySchema = z.object({
  game: z.string().min(1, 'Game is required'),
  turnstileToken: z.string().optional(),
  registrator: z.string().min(1, 'Registrator is required'),
});

export const POST = withPublicApi(async (request) => {
  const body = await request.json();
  const parsed = freeKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  let deviceId = request.cookies.get('free_key_device_id')?.value;
  if (!deviceId) {
    deviceId = crypto.randomUUID();
  }

  const ip = getClientIp(request);

  const result = await generateFreeKey(
    parsed.data.game,
    parsed.data.turnstileToken,
    ip,
    parsed.data.registrator,
    deviceId,
  );
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const response = NextResponse.json({ success: true, adUrl: result.adUrl });
  response.cookies.set('free_key_device_id', deviceId, {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });
  return response;
});
