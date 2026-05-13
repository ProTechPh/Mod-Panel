import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getStreamerByKey, extendKeyForStreamer } from '@/lib/services/tiktok-live-streamer-service';
import { Logger } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  
  if (!key) {
    return NextResponse.json({ error: 'Key is required' }, { status: 400 });
  }
  
  try {
    const streamer = await getStreamerByKey(key);
    
    if (!streamer) {
      return NextResponse.json({ 
        error: 'Streamer not found',
        valid: false 
      });
    }
    
    // Calculate time remaining
    let hoursRemaining = 0;
    if (streamer.key?.expiredDate) {
      const now = new Date();
      const expiry = new Date(streamer.key.expiredDate);
      const diffMs = expiry.getTime() - now.getTime();
      hoursRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
    }
    
    return NextResponse.json({
      valid: true,
      streamer: {
        _id: streamer._id,
        tiktokUsername: streamer.tiktokUsername,
        streamerName: streamer.streamerName,
        contact: streamer.contact,
        status: streamer.status,
        liveDuration: streamer.liveDuration,
        lastLive: streamer.lastLive,
        autoExtendEnabled: streamer.autoExtendEnabled,
        registrator: streamer.registrator,
        key: streamer.key,
      },
      timeRemaining: {
        hours: hoursRemaining,
        formatted: `${hoursRemaining} hours remaining`
      },
      nextAction: hoursRemaining < 24 
        ? `Your key expires in ${hoursRemaining} hours. Go live to extend!`
        : `You have ${hoursRemaining} hours before your key expires.`,
    });
  } catch (error) {
    Logger.error('Streamer status API error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ 
      error: 'Failed to fetch streamer status',
      valid: false 
    }, { status: 500 });
  }
}
