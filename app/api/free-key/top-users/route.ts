import { NextResponse } from 'next/server';
import { getTopAdClaimers } from '@/lib/services/free-key-service';
import { withPublicApi } from '@/lib/api/with-api';

export const GET = withPublicApi(async (request) => {
  const registrator = request.nextUrl.searchParams.get('registrator')?.trim();
  if (!registrator || registrator.length > 100) {
    return NextResponse.json({ error: 'Invalid registrator' }, { status: 400 });
  }

  const limitParam = request.nextUrl.searchParams.get('limit');
  const parsedLimit = limitParam ? Number.parseInt(limitParam, 10) : 10;
  const limit = Number.isFinite(parsedLimit) ? Math.min(50, Math.max(1, parsedLimit)) : 10;

  const topUsers = await getTopAdClaimers(registrator, limit);
  return NextResponse.json(topUsers);
});
