import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import type { ReadableStream as NodeReadableStream } from 'stream/web';
import { withApi } from '@/lib/api/with-api';
import { listLibs, getLib, uploadLib, updateLib, deleteLib } from '@/lib/services/lib-service';

export const GET = withApi(async (request, user) => {
  const libs = await listLibs(user.level === 1 ? undefined : user.username);
  return NextResponse.json(libs);
});

export const POST = withApi(async (request, user) => {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

  if (!file.name.endsWith('.so')) {
    return NextResponse.json({ error: 'Only .so files are allowed' }, { status: 400 });
  }

  const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
  const libType = formData.get('type') as string || 'free';
  const stream = Readable.fromWeb(file.stream() as unknown as NodeReadableStream);

  try {
    const lib = await uploadLib(file.name, `${sizeMB} MB`, file.size, stream, user.username, user.level, libType);
    return NextResponse.json({ ...lib, replaced: true }, { status: 200 });
  } catch (error) {
    if (error instanceof Error && (error as Error & { code?: string }).code === 'FORBIDDEN_REPLACE') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    throw error;
  }
});

export const PATCH = withApi(async (request, user) => {
  const { id, displayName, type } = await request.json();
  if (!id) return NextResponse.json({ error: 'Lib ID required' }, { status: 400 });

  const lib = await getLib(id);
  if (!lib) return NextResponse.json({ error: 'Lib not found' }, { status: 404 });
  if (user.level !== 1 && lib.uploadedBy !== user.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const updates: { displayName?: string; type?: 'free' | 'paid' } = {};
  if (displayName && typeof displayName === 'string') updates.displayName = displayName.trim();
  if (type && (type === 'free' || type === 'paid')) updates.type = type;
  const updated = await updateLib(id, updates);
  return NextResponse.json(updated);
}, { level: [1, 2] });

export const DELETE = withApi(async (request, user) => {
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Lib ID required' }, { status: 400 });

  const lib = await getLib(id);
  if (!lib) return NextResponse.json({ error: 'Lib not found' }, { status: 404 });
  if (user.level !== 1 && lib.uploadedBy !== user.username) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const deleted = await deleteLib(id);
  if (!deleted) return NextResponse.json({ error: 'Lib not found' }, { status: 404 });

  return NextResponse.json({ success: true });
}, { level: [1, 2] });
