import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { getKey, updateKey, deleteKey } from '@/lib/services/key-service';
import { editKeySchema } from '@/lib/validators/key';
import { logAudit } from '@/lib/services/audit-service';
import { getClientIp } from '@/lib/utils/ip';

function canAccess(user: { level: number; username: string }, key: { registrator: string }) {
  return user.level === 1 || key.registrator === user.username;
}

export const GET = withApi(async (request, user, { id }: { id: string }) => {
  const key = await getKey(id);
  if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  if (!canAccess(user, key)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return NextResponse.json(key);
});

export const PUT = withApi(async (request, user, { id }: { id: string }) => {
  const key = await getKey(id);
  if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  if (!canAccess(user, key)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = editKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const updated = await updateKey(id, parsed.data as Parameters<typeof updateKey>[1]);
  if (!updated) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

  const ip = getClientIp(request);
  logAudit({ action: 'key.update', actor: user.username, actorLevel: user.level, target: id, details: body, ip });

  return NextResponse.json(updated);
});

export const DELETE = withApi(async (request, user, { id }: { id: string }) => {
  const key = await getKey(id);
  if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  if (!canAccess(user, key)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const deleted = await deleteKey(id);
  if (!deleted) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

  const ip = getClientIp(request);
  logAudit({ action: 'key.delete', actor: user.username, actorLevel: user.level, target: id, ip });

  return NextResponse.json({ success: true });
});
