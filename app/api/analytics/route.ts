import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getDashboardAnalytics } from '@/lib/services/analytics-service';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const registrator = user.level === 1 ? undefined : user.username;
  const analytics = await getDashboardAnalytics(registrator);
  return NextResponse.json(analytics);
}