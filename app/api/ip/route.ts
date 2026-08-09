import { NextResponse } from 'next/server';
import { getClientIp } from '@/lib/utils/ip';
import { withPublicApi } from '@/lib/api/with-api';

export const GET = withPublicApi(async (request) => {
  const ip = getClientIp(request);
  return NextResponse.json({ ip });
});
