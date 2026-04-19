import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { extendKeyDuration } from '@/lib/services/key-service';
import { extendKeySchema } from '@/lib/validators/key';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = extendKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const result = await extendKeyDuration(parsed.data.keyId, parsed.data.additionalDays, user);
    if (!result) {
      return NextResponse.json({ error: 'Key not found or already expired' }, { status: 404 });
    }

    return NextResponse.json({ success: true, key: result });
  } catch (error) {
    console.error('Extend key duration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
