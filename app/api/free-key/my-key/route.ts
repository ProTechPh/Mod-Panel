import { NextRequest, NextResponse } from 'next/server';
import { getMyFreeKey } from '@/lib/services/free-key-service';
import { authenticate } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user?.username) {
    return NextResponse.json(null);
  }

  const registrator = request.nextUrl.searchParams.get('registrator');
  const game = request.nextUrl.searchParams.get('game');

  if (!registrator || !game) {
    return NextResponse.json({ error: 'Missing registrator or game' }, { status: 400 });
  }

  const result = await getMyFreeKey(user.username, registrator, game);
  if ('error' in result) {
    return NextResponse.json(null);
  }

  return NextResponse.json(result);
}
