import { NextRequest, NextResponse } from 'next/server';
import { generateFreeKey } from '@/lib/services/free-key-service';
import { extractClientIp } from '@/lib/utils/ip';
import { z } from 'zod/v4';

const freeKeySchema = z.object({
  game: z.string().min(1, 'Game is required'),
  turnstileToken: z.string().min(1, 'Captcha verification required'),
  registrator: z.string().min(1, 'Registrator is required'),
  duration: z.enum(['1h', '3h']).optional().default('3h'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = freeKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const ip = extractClientIp(request, []);

    const result = await generateFreeKey(
      parsed.data.game,
      parsed.data.turnstileToken,
      ip,
      parsed.data.registrator,
      parsed.data.duration as '1h' | '3h'
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, key: result.key, adUrl: result.adUrl });
  } catch (error) {
    console.error('Free key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}