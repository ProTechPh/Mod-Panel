import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { downloadFromFtp } from '@/lib/ftp/client';

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileName: string }> }) {
  const user = await authenticate(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { fileName } = await params;

  if (!fileName.endsWith('.so')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const stream = await downloadFromFtp(fileName);
    return new Response(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}