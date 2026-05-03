import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { listAppLinks, addAppLink, deleteAppLink } from '@/lib/services/app-link-service';
import { listGameSettings } from '@/lib/services/game-settings-service';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [appLinks, games] = await Promise.all([
    listAppLinks(),
    listGameSettings(user.level === 1 ? undefined : user.username),
  ]);

  const gameLinks = games
    .filter(g => g.downloadLink && g.isEnabled)
    .map(g => ({
      _id: `game-${g._id}`,
      appName: g.gameName,
      downloadUrl: g.downloadLink,
      isGame: true,
      registrator: g.registrator,
    }));

  return NextResponse.json([...appLinks, ...gameLinks]);
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const link = await addAppLink(body.appName, body.downloadUrl);
    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error('App link error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Link ID required' }, { status: 400 });

  const deleted = await deleteAppLink(id);
  if (!deleted) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}