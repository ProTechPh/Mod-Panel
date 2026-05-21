import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import Lib from '@/lib/db/models/Lib';

/**
 * GET /api/libs/list
 * Public endpoint (no auth required) — returns all libs that have an uploadedBy value.
 * Optional query param: ?uploadedBy=username  → filter by specific uploader.
 * Used by the Android app (MainActivity) for multi-lib selection.
 */
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const uploadedBy = request.nextUrl.searchParams.get('uploadedBy')?.trim();

    const filter: Record<string, any> = { uploadedBy: { $exists: true, $ne: '' } };
    if (uploadedBy) {
      filter.uploadedBy = uploadedBy;
    }

    const libs = await Lib.find(filter)
      .sort({ uploadedAt: -1 })
      .select('fileName displayName type fileSize uploadedBy uploadedAt')
      .lean();

    const origin = process.env.NEXT_PUBLIC_APP_URL || '';

    const result = libs.map((l: any) => ({
      fileName: l.fileName,
      displayName: l.displayName || l.fileName,
      type: l.type || 'free',
      fileSize: l.fileSize || '',
      uploadedBy: l.uploadedBy,
      uploadedAt: l.uploadedAt ? new Date(l.uploadedAt).toISOString() : null,
      downloadUrl: `${origin}/api/libs/serve/${encodeURIComponent(l.fileName)}`,
    }));

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[libs/list]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

