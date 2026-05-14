import { NextRequest, NextResponse } from 'next/server';
import { verifyStreamerToken } from '@/lib/auth/streamer-jwt';
import { getStreamerProfile } from '@/lib/services/tiktok-live-streamer-service';
import { Logger } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('st_access')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyStreamerToken(token);
    const streamer = await getStreamerProfile(payload.streamerKey);

    if (!streamer) {
      return NextResponse.json({ error: 'Streamer not found' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      streamer: {
        _id: streamer._id,
        key: streamer.key,
        tiktokUsername: streamer.tiktokUsername,
        streamerName: streamer.streamerName,
        contact: streamer.contact,
        status: streamer.status,
        liveDuration: streamer.liveDuration,
        lastLive: streamer.lastLive,
        lastLiveDuration: streamer.lastLiveDuration,
        autoExtendEnabled: streamer.autoExtendEnabled,
        registrator: streamer.registrator,
        keyExpiry: streamer.keyExpiry,
        keyStatus: streamer.keyStatus,
      },
    });
  } catch (error) {
    Logger.error('Streamer me error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
