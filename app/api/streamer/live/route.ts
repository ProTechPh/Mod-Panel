import { NextRequest, NextResponse } from 'next/server';
import { verifyStreamerToken } from '@/lib/auth/streamer-jwt';
import { streamerStartLive, streamerEndLive } from '@/lib/services/tiktok-live-streamer-service';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('st_access')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyStreamerToken(token);
    const body = await request.json();
    const { action, durationMinutes } = body;

    if (action === 'start') {
      const result = await streamerStartLive(payload.streamerKey);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, extended: result.extended });
    }

    if (action === 'end') {
      if (typeof durationMinutes !== 'number' || durationMinutes <= 0) {
        return NextResponse.json({ error: 'Valid duration in minutes is required' }, { status: 400 });
      }
      const result = await streamerEndLive(payload.streamerKey, durationMinutes);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action. Use "start" or "end".' }, { status: 400 });
  } catch (error) {
    Logger.error('Streamer live action error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to process live action' }, { status: 500 });
  }
}
