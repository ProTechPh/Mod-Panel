import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { updateStreamer, extendKeyForStreamer } from '@/lib/services/tiktok-live-streamer-service';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await request.json();
    const { id, ...data } = body;
    
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
    
    return NextResponse.json({ error: 'No valid data provided' }, { status: 400 });
  } catch (error) {
    Logger.error('Streamer update API error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to update streamer' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Streamer ID required' }, { status: 400 });
    }
    
    const deleted = await deleteStreamer(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Streamer not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    Logger.error('Delete streamer error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to delete streamer' }, { status: 500 });
  }
}

import { deleteStreamer } from '@/lib/services/tiktok-live-streamer-service';
