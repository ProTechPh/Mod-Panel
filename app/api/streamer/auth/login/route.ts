import { NextRequest, NextResponse } from 'next/server';
import { authenticateStreamer } from '@/lib/services/tiktok-live-streamer-service';
import { signStreamerToken } from '@/lib/auth/streamer-jwt';
import { Logger } from '@/lib/utils';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'License key is required' }, { status: 400 });
    }

    const streamer = await authenticateStreamer(key.trim());

    if (!streamer) {
      return NextResponse.json({ error: 'Invalid license key' }, { status: 401 });
    }

    if (streamer.status === 'expired') {
      return NextResponse.json({ error: 'Your license key has expired. Please contact your admin.' }, { status: 401 });
    }

    const token = await signStreamerToken(streamer.key, streamer._id, streamer.tiktokUsername);

    const response = NextResponse.json({
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
      },
    });

    response.cookies.set('st_access', token, {
      ...COOKIE_OPTIONS,
      maxAge: 12 * 60 * 60,
    });

    return response;
  } catch (error) {
    Logger.error('Streamer login error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
