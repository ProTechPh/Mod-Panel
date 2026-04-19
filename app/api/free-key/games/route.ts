import { NextRequest, NextResponse } from 'next/server';
import GameSetting from '@/lib/db/models/GameSetting';
import dbConnect from '@/lib/db/connection';

export async function GET(request: NextRequest) {
  const registrator = request.nextUrl.searchParams.get('registrator');
  if (!registrator) {
    return NextResponse.json({ error: 'Missing registrator' }, { status: 400 });
  }

  await dbConnect();
  const games = await GameSetting.find({
    registrator,
    isEnabled: true,
    freeKeyEnabled: true,
  }).select('gameCode gameName -_id').lean();

  return NextResponse.json(games.map(g => ({ code: g.gameCode, name: g.gameName })));
}