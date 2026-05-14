import { NextRequest, NextResponse } from 'next/server';
import { getMyFreeKey } from '@/lib/services/free-key-service';
import { extractClientIp } from '@/lib/utils/ip';

export async function GET(request: NextRequest) {
  const ip = extractClientIp(request, []);
  const registrator = request.nextUrl.searchParams.get('registrator');
  const game = request.nextUrl.searchParams.get('game');

  if (!registrator || !game) {
    return NextResponse.json({ error: 'Missing registrator or game' }, { status: 400 });
  }

  const result = await getMyFreeKey(ip, registrator, game);
  if ('error' in result) {
    // "No key found" is a normal state, not an error — return 200 with null
    return NextResponse.json(null);
  }

  return NextResponse.json(result);
}
