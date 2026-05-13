import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { extendKeyForStreamer } from '@/lib/services/tiktok-live-streamer-service';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  try {
    const body = await request.json();
    const { key, days } = body;
    
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 });
    }
    
    const extendDays = days || 7; // Default extend by 7 days
    
    const result = await extendKeyForStreamer(key, extendDays);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Key extended successfully' 
    });
  } catch (error) {
    Logger.error('Key extension API error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to extend key' }, { status: 500 });
  }
}
