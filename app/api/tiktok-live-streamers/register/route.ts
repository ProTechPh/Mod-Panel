import { NextRequest, NextResponse } from 'next/server';
import { registerStreamer } from '@/lib/services/tiktok-live-streamer-service';
import { z } from 'zod/v4';
import { Logger } from '@/lib/utils';

const RegisterSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  tiktokUsername: z.string().min(1, 'TikTok username is required').regex(/^@[a-zA-Z0-9_.]+$/, 'Invalid TikTok username format'),
  streamerName: z.string().min(1, 'Name is required'),
  contact: z.string().min(1, 'Contact information is required'),
  registrator: z.string().min(1, 'Registrator is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = RegisterSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }
    
    const { success, error } = await registerStreamer(result.data.key, result.data);
    
    if (!success) {
      return NextResponse.json({ error }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message: 'Streamer registered successfully' });
  } catch (error) {
    Logger.error('Streamer registration API error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Failed to register streamer' }, { status: 500 });
  }
}
