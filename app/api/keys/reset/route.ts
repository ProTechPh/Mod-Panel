import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { getKey, resetDevices } from '@/lib/services/key-service';
import { logAudit } from '@/lib/services/audit-service';
import { getClientIp } from '@/lib/utils/ip';

export const POST = withApi(async (request, user) => {
  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: 'Key ID required' }, { status: 400 });

  const key = await getKey(id);
  if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  if (user.level !== 1 && key.registrator !== user.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const result = await resetDevices(id);
  if (!result) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

  const ip = getClientIp(request);
  logAudit({ action: 'key.reset', actor: user.username, actorLevel: user.level, target: id, ip });

  return NextResponse.json({ success: true });
});
