import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getKey, updateKey, deleteKey } from '@/lib/services/key-service';
import { editKeySchema } from '@/lib/validators/key';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const key = await getKey(id);
  if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  if (user.level !== 1 && key.registrator !== user.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(key);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const key = await getKey(id);
  if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  if (user.level !== 1 && key.registrator !== user.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = editKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const updated = await updateKey(id, parsed.data as Parameters<typeof updateKey>[1]);
  if (!updated) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const key = await getKey(id);
  if (!key) return NextResponse.json({ error: 'Key not found' }, { status: 404 });
  if (user.level !== 1 && key.registrator !== user.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const deleted = await deleteKey(id);
  if (!deleted) return NextResponse.json({ error: 'Key not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}