import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { updateStreamer } from '@/lib/services/tiktok-live-streamer-service';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Streamer ID required' }, { status: 400 });
    }
    
    if (data.autoExtendEnabled !== undefined) {
      // Toggle auto-extend
      await updateStreamer(id, { autoExtendEnabled: data.autoExtendEnabled });
      return NextResponse.json({ success: true });
    }
    
    if (data.status) {
      // Update status
      await updateStreamer(id, { status: data.status });
      return NextResponse.json({ success: true });
    }
    
    if (data.tiktokUsername || data.streamerName || data.contact) {
      // Update profile fields
      const updateData: Record<string, string> = {};
      if (data.tiktokUsername) updateData.tiktokUsername = data.tiktokUsername;
      if (data.streamerName) updateData.streamerName = data.streamerName;
      if (data.contact) updateData.contact = data.contact;
      await updateStreamer(id, updateData);
      return NextResponse.json({ success: true });
    }
    
    return NextResponse.json({ error: 'No valid data provided' }, { status: 400 });
  } catch (error) {
    Logger.error('Streamer update API error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to update streamer' }, { status: 500 });
  }
}
