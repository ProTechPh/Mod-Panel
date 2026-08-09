import { NextResponse } from 'next/server';
import { getTopAdClaimers } from '@/lib/services/free-key-service';
import { withPublicApi } from '@/lib/api/with-api';

export const GET = withPublicApi(async (request) => {
  const limitParam = request.nextUrl.searchParams.get('limit');
  const limit = limitParam ? parseInt(limitParam) : 10;

  const topUsers = await getTopAdClaimers(limit);
  return NextResponse.json(topUsers);
});
