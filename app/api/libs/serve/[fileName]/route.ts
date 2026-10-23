import { NextResponse } from 'next/server';
import { downloadFromFtp } from '@/lib/ftp/client';
import dbConnect from '@/lib/db/connection';
import Lib from '@/lib/db/models/Lib';
import { logLibDownload } from '@/lib/services/lib-service';
import { getClientIp } from '@/lib/utils/ip';
import { withPublicApi } from '@/lib/api/with-api';

/**
 * Never let browsers, CDNs, or the Android client store a served .so file.
 *
 * Libs are mutable by design (re-uploading the same fileName replaces the file,
 * deleting removes it), but the URL stays identical. Any positive max-age means
 * a replaced file keeps serving old bytes and a deleted file keeps downloading
 * until the TTL expires. `no-store` guarantees the next request always reflects
 * the current DB/FTP state. ETag conditional requests are still honoured for
 * clients that already hold a previously cached copy.
 */
const NO_STORE = 'no-store, max-age=0';

// `Vercel-CDN-Cache-Control` has the highest priority on Vercel's edge network.
// Sending all three guarantees no layer (browser, CDN, or Vercel) stores the
// response, so a replaced/deleted lib is reflected on the very next request.
const NO_STORE_HEADERS = {
  'Cache-Control': NO_STORE,
  'CDN-Cache-Control': NO_STORE,
  'Vercel-CDN-Cache-Control': NO_STORE,
} as const;

function notModified(lastModifiedStr: string, etag: string) {
  return new Response(null, {
    status: 304,
    headers: {
      ETag: etag,
      'Last-Modified': lastModifiedStr,
      ...NO_STORE_HEADERS,
    },
  });
}

export const GET = withPublicApi(async (request, { fileName }: { fileName: string }) => {
  if (!fileName.endsWith('.so')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await dbConnect();
  const lib = await Lib.findOne({ fileName }).lean();
  if (!lib) {
    return NextResponse.json(
      { error: 'File not found' },
      { status: 404, headers: NO_STORE_HEADERS },
    );
  }

  const lastModified = lib.uploadedAt ? new Date(lib.uploadedAt) : new Date();
  const lastModifiedStr = lastModified.toUTCString();
  const version = lastModified.getTime().toString(36);
  const etag = `W/"${version}-${lib.fileSizeBytes ?? 0}"`;

  const ifNoneMatch = request.headers.get('If-None-Match');
  if (ifNoneMatch) {
    // Per RFC 9110, If-None-Match takes precedence over If-Modified-Since.
    const tags = ifNoneMatch.split(',').map(tag => tag.trim());
    if (tags.includes('*') || tags.includes(etag) || tags.includes(etag.slice(2))) {
      return notModified(lastModifiedStr, etag);
    }
  } else {
    const ifModifiedSince = request.headers.get('If-Modified-Since');
    if (ifModifiedSince) {
      const clientDate = new Date(ifModifiedSince);
      if (
        !Number.isNaN(clientDate.getTime()) &&
        clientDate.getTime() >= Math.floor(lastModified.getTime() / 1000) * 1000
      ) {
        return notModified(lastModifiedStr, etag);
      }
    }
  }

  const stream = await downloadFromFtp(fileName);

  const ip = getClientIp(request);
  const ua = request.headers.get('user-agent') || '';
  logLibDownload(lib._id.toString(), lib.fileName, lib.uploadedBy, ip, ua).catch(() => {});

  const headers: Record<string, string> = {
    'Content-Type': 'application/octet-stream',
    'Content-Disposition': `attachment; filename="${fileName}"`,
    'Last-Modified': lastModifiedStr,
    'ETag': etag,
    ...NO_STORE_HEADERS,
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

  return new Response(webStream, { headers });
});
