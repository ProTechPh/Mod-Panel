import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getUser, updateUser, deleteUser } from '@/lib/services/user-service';
import { logAudit } from '@/lib/services/audit-service';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const target = await getUser(id);
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  return NextResponse.json(target);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const updated = await updateUser(id, body);

  if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  logAudit({ action: 'user.update', actor: user.username, actorLevel: user.level, target: id, details: body, ip });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const deleted = await deleteUser(id);
  if (!deleted) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  logAudit({ action: 'user.delete', actor: user.username, actorLevel: user.level, target: id, ip });

  return NextResponse.json({ success: true });
}