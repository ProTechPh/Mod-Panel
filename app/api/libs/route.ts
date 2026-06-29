import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'stream';
import type { ReadableStream as NodeReadableStream } from 'stream/web';
import { authenticate } from '@/lib/auth/middleware';
import { listLibs, getLib, uploadLib, updateLib, deleteLib } from '@/lib/services/lib-service';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const libs = await listLibs(user.level === 1 ? undefined : user.username);
  return NextResponse.json(libs);
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    if (!file.name.endsWith('.so')) {
      return NextResponse.json({ error: 'Only .so files are allowed' }, { status: 400 });
    }

    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    const libType = formData.get('type') as string || 'free';
    const stream = Readable.fromWeb(file.stream() as unknown as NodeReadableStream);

    const lib = await uploadLib(file.name, `${sizeMB} MB`, file.size, stream, user.username, user.level, libType);

    return NextResponse.json({ ...lib, replaced: true }, { status: 200 });
  } catch (error: any) {
    if (error.code === 'FORBIDDEN_REPLACE') {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    console.error('Lib upload error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || (user.level !== 1 && user.level !== 2)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id, displayName, type } = await request.json();
    if (!id) return NextResponse.json({ error: 'Lib ID required' }, { status: 400 });

    const lib = await getLib(id);
    if (!lib) return NextResponse.json({ error: 'Lib not found' }, { status: 404 });
    if (user.level !== 1 && lib.uploadedBy !== user.username) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updates: Record<string, any> = {};
    if (displayName && typeof displayName === 'string') updates.displayName = displayName.trim();
    if (type && (type === 'free' || type === 'paid')) updates.type = type;
    const updated = await updateLib(id, updates);
    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('Lib update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || (user.level !== 1 && user.level !== 2)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
}