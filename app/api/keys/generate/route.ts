import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { generateKeys } from '@/lib/services/key-service';
import { generateKeySchema, parseDuration } from '@/lib/validators/key';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = generateKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const result = await generateKeys(
      user.userId,
      user.username,
      parsed.data.game,
      parseDuration(parsed.data.duration),
      parsed.data.maxDevices,
      parsed.data.count
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, keys: result.keys, newSaldo: result.newSaldo });
  } catch (error) {
    console.error('Key generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}