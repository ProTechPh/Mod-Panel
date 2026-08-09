import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { generateKeys } from '@/lib/services/key-service';
import { generateKeySchema, parseDuration } from '@/lib/validators/key';
import { logAudit } from '@/lib/services/audit-service';
import { getClientIp } from '@/lib/utils/ip';
import User from '@/lib/db/models/User';

export const POST = withApi(async (request, user) => {
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

  const ip = getClientIp(request);
  logAudit({ action: 'key.generate', actor: user.username, actorLevel: user.level, target: `game:${parsed.data.game}`, details: { count: parsed.data.count, duration: parsed.data.duration, maxDevices: parsed.data.maxDevices }, ip });

  return NextResponse.json({ success: true, keys: result.keys, newSaldo: result.newSaldo });
});
