import { NextResponse } from 'next/server';
import { z } from 'zod/v4';
import { withPublicApi } from '@/lib/api/with-api';
import { advanceFreeKeySponsorStage } from '@/lib/services/free-key-service';

const sponsorStageSchema = z.object({
  token: z.string().min(1).max(4096),
});

export const POST = withPublicApi(async (request) => {
  const parsed = sponsorStageSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid sponsor stage' }, { status: 400 });
  }

  const deviceId = request.cookies.get('free_key_device_id')?.value;
  if (!deviceId) {
    return NextResponse.json({ error: 'Sponsor session not found. Start again from the free-key page.' }, { status: 400 });
  }

  const result = await advanceFreeKeySponsorStage(parsed.data.token, deviceId);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    nextUrl: result.nextUrl,
    adUrl: result.adUrl,
  });
});
