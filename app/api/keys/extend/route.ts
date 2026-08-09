import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { extendKeyDuration } from '@/lib/services/key-service';
import { extendKeySchema } from '@/lib/validators/key';
import { logAudit } from '@/lib/services/audit-service';
import { getClientIp } from '@/lib/utils/ip';

export const POST = withApi(async (request, user) => {
  const body = await request.json();
  const parsed = extendKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const result = await extendKeyDuration(parsed.data.keyId, parsed.data.additionalDays, user);
  if (!result) {
    return NextResponse.json({ error: 'Key not found or already expired' }, { status: 404 });
  }

  const ip = getClientIp(request);
  logAudit({ action: 'key.extend', actor: user.username, actorLevel: user.level, target: parsed.data.keyId, details: { additionalDays: parsed.data.additionalDays }, ip });

  return NextResponse.json({ success: true, key: result });
});
