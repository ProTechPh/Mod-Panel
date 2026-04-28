import { NextRequest, NextResponse } from 'next/server';
import { getAvailableGames } from '@/lib/services/free-key-service';

export async function GET(request: NextRequest) {
  const registrator = request.nextUrl.searchParams.get('registrator');
  if (!registrator) {
    return NextResponse.json({ error: 'Missing registrator' }, { status: 400 });
  }

  const ip = request.headers.get('x-client-ip') || 'unknown';
  const games = await getAvailableGames(ip, registrator);

  return NextResponse.json(games);
}