import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/connection';
import FtpConfig from '@/lib/db/models/FtpConfig';
import { authenticate } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const configs = await FtpConfig.find().sort({ order: 1 }).lean();
  return NextResponse.json(configs.map(c => ({ ...c, password: '••••••' })));
}

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const body = await request.json();
  const config = await FtpConfig.create(body);
  return NextResponse.json({ ...config.toObject(), password: '••••••' }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const { _id, ...updates } = await request.json();
  if (!_id) return NextResponse.json({ error: '_id required' }, { status: 400 });
  if (!updates.password || updates.password === '••••••') delete updates.password;
  const config = await FtpConfig.findByIdAndUpdate(_id, { $set: updates }, { new: true }).lean();
  if (!config) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ...config, password: '••••••' });
}

export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  await dbConnect();
  const id = request.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await FtpConfig.findByIdAndDelete(id);
  return NextResponse.json({ success: true });
}
