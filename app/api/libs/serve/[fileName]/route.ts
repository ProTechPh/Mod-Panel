import { NextResponse } from 'next/server';
import { downloadFromFtp } from '@/lib/ftp/client';
import dbConnect from '@/lib/db/connection';
import Lib from '@/lib/db/models/Lib';
import { logLibDownload } from '@/lib/services/lib-service';
import { getClientIp } from '@/lib/utils/ip';
import { withPublicApi } from '@/lib/api/with-api';

export const GET = withPublicApi(async (request, { fileName }: { fileName: string }) => {
  if (!fileName.endsWith('.so')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();
  const lib = await Lib.findOne({ fileName }).lean();
  if (!lib) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const ip = getClientIp(request);
  const ua = request.headers.get('user-agent') || '';
  logLibDownload(lib._id.toString(), lib.fileName, lib.uploadedBy, ip, ua).catch(() => {});

  const lastModified = lib.uploadedAt
    ? new Date(lib.uploadedAt)
    : new Date();
  const lastModifiedStr = lastModified.toUTCString();
  const etag = `W/"${lastModified.getTime().toString(36)}"`;

  const ifModifiedSince = request.headers.get('If-Modified-Since');
  const ifNoneMatch = request.headers.get('If-None-Match');

  if (ifNoneMatch === etag || ifNoneMatch === `"${lastModified.getTime().toString(36)}"`) {
    return new Response(null, { status: 304 });
  }

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
    'ETag': etag,
  };

  if (lib.fileSizeBytes) {
    headers['Content-Length'] = lib.fileSizeBytes.toString();
  }

  const webStream = new ReadableStream({
    start(controller) {
      stream.on('data', (chunk: Buffer) => controller.enqueue(chunk));
      stream.on('end', () => controller.close());
      stream.on('error', (err: Error) => controller.error(err));
    },
  });

  return new Response(webStream, {
    headers: {
      ...headers,
      'Cache-Control': 'public, max-age=86400, must-revalidate',
      'CDN-Cache-Control': 'public, max-age=86400, must-revalidate',
    },
  });
});
