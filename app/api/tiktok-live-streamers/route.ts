import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { listStreamers, deleteStreamer, generateStreamerKey } from '@/lib/services/tiktok-live-streamer-service';
import { Logger } from '@/lib/utils';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    // Owners (1) and Admins (2) see all streamers, Resellers (3) see only their own
    const registrator = user.level <= 2 ? undefined : user.username;
    const streamers = await listStreamers(registrator);
    return NextResponse.json(streamers);
  } catch (error) {
    Logger.error('List streamers error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to fetch streamers' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level > 2) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await generateStreamerKey(user.username);
    return NextResponse.json(result);
  } catch (error) {
    Logger.error('Generate key error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to generate key' }, { status: 500 });
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
