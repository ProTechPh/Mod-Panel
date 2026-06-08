import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { generateKeys } from '@/lib/services/key-service';
import { sendNotification } from '@/lib/services/notification-service';
import { generateKeySchema, parseDuration } from '@/lib/validators/key';
import { logAudit } from '@/lib/services/audit-service';
import User from '@/lib/db/models/User';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const parsed = generateKeySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    // Resellers generate keys under their uplink admin
    let registrator = user.username;
    if (user.level === 3) {
      const dbUser = await User.findById(user.userId).select('uplink').lean();
      registrator = dbUser?.uplink || user.username;
    }

    const result = await generateKeys(
      user.userId,
      registrator,
      parsed.data.game,
      parseDuration(parsed.data.duration),
      parsed.data.maxDevices,
      parsed.data.count,
      user.level
    );

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    sendNotification('key.generated', {
      keys: result.keys?.map((k: any) => k.key || k).join(', '),
      game: parsed.data.game,
      duration: parsed.data.duration,
      count: parsed.data.count,
      generatedBy: user.username,
    }).catch(console.error);

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    logAudit({ action: 'key.generate', actor: user.username, actorLevel: user.level, target: `game:${parsed.data.game}`, details: { count: parsed.data.count, duration: parsed.data.duration, maxDevices: parsed.data.maxDevices }, ip });

    return NextResponse.json({ success: true, keys: result.keys, newSaldo: result.newSaldo });
  } catch (error) {
    console.error('Key generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}