import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import dbConnect from '@/lib/db/connection';
import IpTracker from '@/lib/db/models/IpTracker';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await dbConnect();
  
  try {
    const logs = await IpTracker.find()
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch IP logs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
