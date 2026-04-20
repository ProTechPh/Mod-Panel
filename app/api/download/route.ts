import { NextResponse } from 'next/server';
import { listAppLinks, getLatestModPanelRelease } from '@/lib/services/app-link-service';
import { listGameSettings } from '@/lib/services/game-settings-service';

export async function GET() {
  const [appLinks, games, modPanelRelease] = await Promise.all([
    listAppLinks(),
    listGameSettings(),
    getLatestModPanelRelease(),
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

  // Inject the latest Mod Panel APK at the top (only if fetched successfully)
  const modPanelLink = modPanelRelease ? [modPanelRelease] : [];

  return NextResponse.json([...modPanelLink, ...appLinks, ...gameLinks]);
}