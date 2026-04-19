import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getKeyStats } from '@/lib/services/key-service';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const stats = await getKeyStats(user.level === 1 ? undefined : user.username);
  return NextResponse.json(stats);
}