import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import Lib from '@/lib/db/models/Lib';
import { withPublicApi } from '@/lib/api/with-api';

/**
 * GET /api/libs/list
 * Public endpoint (no auth required) — returns all libs that have an uploadedBy value.
 * Optional query param: ?uploadedBy=username  → filter by specific uploader.
 * Used by the Android app (MainActivity) for multi-lib selection.
 */
export const GET = withPublicApi(async (request) => {
  await dbConnect();

  const uploadedBy = request.nextUrl.searchParams.get('uploadedBy')?.trim();

  const filter: Record<string, unknown> = { uploadedBy: { $exists: true, $ne: '' } };
  if (uploadedBy) {
    filter.uploadedBy = uploadedBy;
  }

  const libs = await Lib.find(filter)
    .sort({ uploadedAt: -1 })
    .select('fileName displayName type fileSize uploadedBy uploadedAt')
    .lean();

  const origin = process.env.NEXT_PUBLIC_APP_URL || '';

  const result = libs.map((l) => {
    const version = l.uploadedAt
      ? new Date(l.uploadedAt).getTime().toString(36)
      : '0';
    const baseUrl = `${origin}/api/libs/serve/${encodeURIComponent(l.fileName)}`;
    return {
      fileName: l.fileName,
      displayName: l.displayName || l.fileName,
      type: l.type || 'free',
      fileSize: l.fileSize || '',
      uploadedBy: l.uploadedBy,
      uploadedAt: l.uploadedAt ? new Date(l.uploadedAt).toISOString() : null,
      downloadUrl: `${baseUrl}?v=${version}`,
    };
  });

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
});
