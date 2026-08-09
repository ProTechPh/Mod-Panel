import { NextRequest, NextResponse } from 'next/server';
import { generateFreeKey } from '@/lib/services/free-key-service';
import { extractClientIp } from '@/lib/utils/ip';
import { authenticate } from '@/lib/auth/middleware';
import { z } from 'zod/v4';

const freeKeySchema = z.object({
  game: z.string().min(1, 'Game is required'),
  turnstileToken: z.string().optional(),
  registrator: z.string().min(1, 'Registrator is required'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = freeKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const user = await authenticate(request);
    if (!user?.username) {
      return NextResponse.json({ error: 'You must be logged in to generate free keys' }, { status: 401 });
    }

    const ip = extractClientIp(request, []);

    const result = await generateFreeKey(
      parsed.data.game,
      parsed.data.turnstileToken,
      ip,
      parsed.data.registrator,
      user.username,
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, adUrl: result.adUrl });
  } catch (error) {
    console.error('Free key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
