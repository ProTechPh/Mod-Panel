import { NextRequest, NextResponse } from 'next/server';
import { generateFreeKey } from '@/lib/services/free-key-service';
import { z } from 'zod/v4';

const freeKeySchema = z.object({
  game: z.string().min(1, 'Game is required'),
  turnstileToken: z.string().min(1, 'Captcha verification required'),
  registrator: z.string().min(1, 'Registrator is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = freeKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    const result = await generateFreeKey(parsed.data.game, parsed.data.turnstileToken, ip, parsed.data.registrator);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, key: result.key });
  } catch (error) {
    console.error('Free key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}