import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { getUser, updateUser, deleteUser } from '@/lib/services/user-service';
import { logAudit } from '@/lib/services/audit-service';
import { getClientIp } from '@/lib/utils/ip';

export const GET = withApi(async (request, user, { id }: { id: string }) => {
  const target = await getUser(id);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(target);
}, { level: 1 });

export const PUT = withApi(async (request, user, { id }: { id: string }) => {
  const body = await request.json();
  const updated = await updateUser(id, body);

  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const ip = getClientIp(request);
  logAudit({ action: 'user.update', actor: user.username, actorLevel: user.level, target: id, details: body, ip });

  return NextResponse.json(updated);
}, { level: 1 });

export const DELETE = withApi(async (request, user, { id }: { id: string }) => {
  const deleted = await deleteUser(id);
  if (!deleted) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const ip = getClientIp(request);
  logAudit({ action: 'user.delete', actor: user.username, actorLevel: user.level, target: id, ip });

  return NextResponse.json({ success: true });
}, { level: 1 });
