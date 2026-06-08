import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { extendKeyDuration } from '@/lib/services/key-service';
import { extendKeySchema } from '@/lib/validators/key';
import { logAudit } from '@/lib/services/audit-service';

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

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    logAudit({ action: 'key.extend', actor: user.username, actorLevel: user.level, target: parsed.data.keyId, details: { additionalDays: parsed.data.additionalDays }, ip });

    return NextResponse.json({ success: true, key: result });
  } catch (error) {
    console.error('Extend key duration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
