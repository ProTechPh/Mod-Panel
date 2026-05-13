import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import TikTokLiveStreamer from '@/lib/db/models/TikTokLiveStreamer';
import Key from '@/lib/db/models/Key';
import { Logger } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * Cron endpoint for TikTok Live Streamers.
 * - Check streamers with expiring keys
 * - Auto-extend keys if autoExtendEnabled is true
 * - Update streamer status
 *
 * Call with ?secret=YOUR_SECRET or Authorization: Bearer YOUR_SECRET
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const secret = request.nextUrl.searchParams.get('secret');
  const CRON_SECRET = process.env.CRON_SECRET;

  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}` && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  const now = new Date();
  const results: { action: string; count: number }[] = [];

  try {
    // Find streamers with keys expiring within 24 hours
    const expiresSoon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const streamersToExtend = await TikTokLiveStreamer.find({
      autoExtendEnabled: true,
      status: 'active',
      updatedAt: { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } // Active in last 7 days
    }).lean();

    let extendCount = 0;
    for (const streamer of streamersToExtend) {
      try {
        // Check if key needs extension (within 24 hours)
        const key = await Key.findOne({ userKey: streamer.key }).lean();
        if (key && key.expiredDate) {
          const expiryDate = new Date(key.expiredDate);
          const hoursRemaining = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
          
          if (hoursRemaining <= 24 && hoursRemaining > 0) {
            // Auto-extend by 7 days
            const newExpiry = new Date(expiryDate);
            newExpiry.setDate(newExpiry.getDate() + 7);
            
            await Key.findByIdAndUpdate(key._id, {
              expiredDate: newExpiry,
              status: 1,
            });
            
            // Update streamer status
            await TikTokLiveStreamer.findByIdAndUpdate(streamer._id, {
              status: 'active',
              updatedAt: now,
            });
            
            extendCount++;
            Logger.info(`[TikTok Live Cron] Auto-extended key for ${streamer.tiktokUsername}`);
          }
        }
      } catch (err) {
        Logger.error(`[TikTok Live Cron] Failed to extend key for ${streamer.tiktokUsername}`, {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    results.push({ action: 'auto_extend', count: extendCount });

    // Find streamers with expired keys
    const expiredStreamers = await TikTokLiveStreamer.find({
      status: 'active',
      updatedAt: { $lt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } // Inactive for 30 days
    }).lean();

    let expireCount = 0;
    for (const streamer of expiredStreamers) {
      try {
        const key = await Key.findOne({ userKey: streamer.key }).lean();
        if (key && key.expiredDate && new Date(key.expiredDate) < now) {
          await TikTokLiveStreamer.findByIdAndUpdate(streamer._id, {
            status: 'expired',
            updatedAt: now,
          });
          expireCount++;
        }
      } catch (err) {
        Logger.error(`[TikTok Live Cron] Failed to expire key for ${streamer.tiktokUsername}`, {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    }

    results.push({ action: 'expire_expired', count: expireCount });

    Logger.info(`[TikTok Live Cron] Completed - Extended: ${extendCount}, Expired: ${expireCount}`);

    return NextResponse.json({
      success: true,
      message: 'TikTok Live Cron completed',
      results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    Logger.error('[TikTok Live Cron] Error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return NextResponse.json({ 
      error: 'Failed to process cron job',
      success: false 
    }, { status: 500 });
  }
}
