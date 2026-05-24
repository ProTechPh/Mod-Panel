import { NextRequest, NextResponse } from 'next/server';
import { downloadFromFtp } from '@/lib/ftp/client';
import dbConnect from '@/lib/db/connection';
import Lib from '@/lib/db/models/Lib';

export async function GET(request: NextRequest, { params }: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await params;

  if (!fileName.endsWith('.so')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await dbConnect();
    const lib = await Lib.findOne({ fileName }).lean();

    const lastModified = lib?.uploadedAt
      ? new Date(lib.uploadedAt)
      : new Date();
    const lastModifiedStr = lastModified.toUTCString();

    const ifModifiedSince = request.headers.get('If-Modified-Since');
    if (ifModifiedSince) {
      const clientDate = new Date(ifModifiedSince);
      if (clientDate.getTime() >= Math.floor(lastModified.getTime() / 1000) * 1000) {
        return new Response(null, { status: 304 });
      }
    }

    const stream = await downloadFromFtp(fileName);

    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Last-Modified': lastModifiedStr,
    };

    if (lib?.fileSizeBytes) {
      headers['Content-Length'] = lib.fileSizeBytes.toString();
    }

    return new Response(stream as unknown as ReadableStream, {
      headers: {
        ...headers,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'CDN-Cache-Control': 'public, max-age=31536000, immutable',
        'Cloudflare-CDN-Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}
