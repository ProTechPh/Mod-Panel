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

    // Build Last-Modified from the DB record (falls back to now if missing)
    const lastModified = lib?.uploadedAt
      ? new Date(lib.uploadedAt)
      : new Date();
    const lastModifiedStr = lastModified.toUTCString();

    // Handle If-Modified-Since — return 304 if the client already has the latest
    const ifModifiedSince = request.headers.get('If-Modified-Since');
    if (ifModifiedSince) {
      const clientDate = new Date(ifModifiedSince);
      // Compare at second-level precision (HTTP dates don't have ms)
      if (clientDate.getTime() >= Math.floor(lastModified.getTime() / 1000) * 1000) {
        return new Response(null, { status: 304 });
      }
    }

    const stream = await downloadFromFtp(fileName);
    
    // Get file size from DB if available to provide Content-Length
    const headers: Record<string, string> = {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${fileName}"`,
      'Last-Modified': lastModifiedStr,
    };

    if (lib?.fileSizeBytes) {
      headers['Content-Length'] = lib.fileSizeBytes.toString();
    }

    return new Response(stream as unknown as ReadableStream, { headers });
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}