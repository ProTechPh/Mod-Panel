import { NextResponse } from 'next/server';
import { listGameSettings } from '@/lib/services/game-settings-service';
import { withPublicApi } from '@/lib/api/with-api';

export const GET = withPublicApi(async (_request, { registrator }: { registrator: string }) => {
  if (!registrator) {
    return NextResponse.json({ status: false, reason: 'Missing registrator' });
  }

  const games = await listGameSettings(registrator);
  const announcements = games
    .filter(g => g.announcementStatus === 'on' && g.announcement)
    .map(g => ({
      gameCode: g.gameCode,
      gameName: g.gameName,
      message: g.announcement,
    }));

  return NextResponse.json({
    status: true,
    registrator,
    announcements,
  });
});
