import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import TikTokLiveStreamer from '@/lib/db/models/TikTokLiveStreamer';
import Key from '@/lib/db/models/Key';
import { Logger } from '@/lib/utils';

/**
 * PUBLIC endpoint — returns active streamers for the landing page.
 * Only exposes safe, non-sensitive fields.
 */
export async function GET() {
  try {
    await dbConnect();

    const streamers = await TikTokLiveStreamer.find({
      status: { $in: ['active', 'inactive'] },
      tiktokUsername: { $ne: 'Pending...' },
    })
      .sort({ status: -1, liveDuration: -1, lastLive: -1 })
      .limit(20)
      .lean();

    // Enrich with key expiry info
    const enriched = await Promise.all(
      streamers.map(async (s) => {
        const keyData = await Key.findOne({ userKey: s.key }).select('expiredDate status').lean();
        const isLive = s.status === 'active';
        const keyExpired = keyData?.expiredDate && new Date(keyData.expiredDate) < new Date();

        return {
          _id: s._id.toString(),
          tiktokUsername: s.tiktokUsername,
          streamerName: s.streamerName,
          status: keyExpired ? 'expired' : s.status,
          isLive,
          liveDuration: s.liveDuration,
          lastLive: s.lastLive?.toISOString() || null,
          lastLiveDuration: s.lastLiveDuration,
          autoExtendEnabled: s.autoExtendEnabled,
          keyExpiry: keyData?.expiredDate?.toISOString() || null,
        };
      })
    );

    // Sort: live streamers first, then by lastLive recency
    enriched.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      if (a.lastLive && b.lastLive) return new Date(b.lastLive).getTime() - new Date(a.lastLive).getTime();
      return 0;
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    Logger.error('Public streamer list error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: false, error: 'Failed to fetch streamers' }, { status: 500 });
  }
}
