import { NextResponse } from 'next/server';
import { listAppLinks } from '@/lib/services/app-link-service';
import { listGameSettings } from '@/lib/services/game-settings-service';
import { withPublicApi } from '@/lib/api/with-api';

export const GET = withPublicApi(async () => {
  const [appLinks, games] = await Promise.all([
    listAppLinks(),
    listGameSettings(),
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
