import { NextResponse } from 'next/server';
import GameSetting from '@/lib/db/models/GameSetting';
import dbConnect from '@/lib/db/connection';
import { withPublicApi } from '@/lib/api/with-api';

export const GET = withPublicApi(async (request) => {
  const registrator = request.nextUrl.searchParams.get('registrator');
  if (!registrator) {
    return NextResponse.json({ error: 'Missing registrator' }, { status: 400 });
  }

  await dbConnect();
  const games = await GameSetting.find({
    registrator,
    isEnabled: true,
    freeKeyEnabled: true,
  }).select('gameCode gameName downloadLink -_id').lean();

  return NextResponse.json(games.map(g => ({ 
    code: g.gameCode, 
    name: g.gameName,
    downloadLink: g.downloadLink 
  })));
});
