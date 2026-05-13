import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { startLiveSession, endLiveSession } from '@/lib/services/tiktok-live-streamer-service';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await request.json();
    const { id, durationMinutes } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'Streamer ID required' }, { status: 400 });
    }
    
    if (durationMinutes !== undefined) {
      // End live session with duration
      const result = await endLiveSession(id, durationMinutes);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    } else {
      // Start live session
      const result = await startLiveSession(id);
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ 
        success: true, 
        extended: result.extended 
      });
    }
  } catch (error) {
    Logger.error('Live session API error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to process live session' }, { status: 500 });
  }
}
