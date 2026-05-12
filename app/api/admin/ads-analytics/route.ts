import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getAdsAnalytics } from '@/lib/services/ads-analytics-service';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user || user.level !== 1) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const analytics = await getAdsAnalytics();
    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Failed to fetch ads analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}