import { NextRequest, NextResponse } from 'next/server';
import { listGameSettings } from '@/lib/services/game-settings-service';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ registrator: string }> }
) {
  try {
    const { registrator } = await params;
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
  } catch (error) {
    console.error('Announcement error:', error);
    return NextResponse.json({ status: false, reason: 'Server error' });
  }
}
