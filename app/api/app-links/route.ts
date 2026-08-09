import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { listAppLinks, addAppLink, deleteAppLink } from '@/lib/services/app-link-service';
import { listGameSettings } from '@/lib/services/game-settings-service';

export const GET = withApi(async (request, user) => {
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
});

export const POST = withApi(async (request) => {
  const body = await request.json();
  const link = await addAppLink(body.appName, body.downloadUrl);
  return NextResponse.json(link, { status: 201 });
}, { level: 1 });

export const DELETE = withApi(async (request) => {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Link ID required' }, { status: 400 });

  const deleted = await deleteAppLink(id);
  if (!deleted) return NextResponse.json({ error: 'Link not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}, { level: 1 });
