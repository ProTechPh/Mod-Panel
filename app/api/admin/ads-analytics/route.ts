import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { getAdsAnalytics } from '@/lib/services/ads-analytics-service';

export const GET = withApi(async () => {
  const analytics = await getAdsAnalytics();
  return NextResponse.json({ success: true, data: analytics });
}, { level: 1 });
