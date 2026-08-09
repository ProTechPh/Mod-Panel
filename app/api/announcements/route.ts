import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import Announcement from '@/lib/db/models/Announcement';
import { withPublicApi } from '@/lib/api/with-api';

// Falls back to an empty list on DB errors so the landing page never breaks.
export const GET = withPublicApi(async () => {
  try {
    await dbConnect();
    const announcements = await Announcement.find({ isActive: true })
      .sort({ priority: -1, createdAt: -1 })
      .lean();
    return NextResponse.json(announcements.map(a => ({
      _id: a._id.toString(),
      title: a.title,
      content: a.content,
      priority: a.priority,
      createdAt: a.createdAt,
    })));
  } catch {
    return NextResponse.json([]);
  }
});
