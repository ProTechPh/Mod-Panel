import { NextRequest, NextResponse } from 'next/server';
import { verifyStreamerToken } from '@/lib/auth/streamer-jwt';
import { updateStreamerProfile } from '@/lib/services/tiktok-live-streamer-service';
import { Logger } from '@/lib/utils';

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get('st_access')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyStreamerToken(token);
    const body = await request.json();
    const { streamerName, contact } = body;

    if (!streamerName && !contact) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const result = await updateStreamerProfile(payload.streamerKey, { streamerName, contact });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Profile updated' });
  } catch (error) {
    Logger.error('Streamer profile update error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
