import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import Announcement from '@/lib/db/models/Announcement';
import { authenticate } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const announcements = await Announcement.find().sort({ priority: -1, createdAt: -1 }).lean();
  return NextResponse.json(announcements.map(a => ({ ...a, _id: a._id.toString() })));
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const body = await request.json();
  const announcement = await Announcement.create({ ...body, createdBy: user.username });
  return NextResponse.json({ ...announcement.toObject(), _id: announcement._id.toString() }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const { _id, ...updates } = await request.json();
  if (!_id) return NextResponse.json({ error: '_id required' }, { status: 400 });
  const announcement = await Announcement.findByIdAndUpdate(_id, { $set: updates }, { returnDocument: 'after' }).lean();
  if (!announcement) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...announcement, _id: announcement._id.toString() });
}

export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await Announcement.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
