import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { listGameSettings, addGameSetting, updateGameSetting } from '@/lib/services/game-settings-service';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || (user.level !== 1 && user.level !== 2)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const games = await listGameSettings(user.level === 1 ? undefined : user.username);
  return NextResponse.json(games);
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || (user.level !== 1 && user.level !== 2)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();

    if (body._method === 'DELETE') {
      const { deleteGameSetting } = await import('@/lib/services/game-settings-service');
      const registrator = user.level === 1 ? (body.registrator || undefined) : user.username;
      const deleted = await deleteGameSetting(body.gameCode, registrator);
      if (!deleted) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      return NextResponse.json({ success: true });
    }

    if (body.gameCode && body.gameName) {
      const game = await addGameSetting({ ...body, registrator: user.username });
      return NextResponse.json(game, { status: 201 });
    }

    if (body.gameCode) {
      const registrator = user.level === 1 ? (body.registrator || undefined) : user.username;
      const game = await updateGameSetting(body.gameCode, body, registrator);
      if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 });
      return NextResponse.json(game);
    }

    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  } catch (error) {
    console.error('Game settings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}