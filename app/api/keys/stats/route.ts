import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { getKeyStats } from '@/lib/services/key-service';

export const GET = withApi(async (request, user) => {
  const stats = await getKeyStats(user.level === 1 ? undefined : user.username);
  return NextResponse.json(stats);
});
