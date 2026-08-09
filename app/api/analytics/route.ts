import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { getDashboardAnalytics } from '@/lib/services/analytics-service';

export const GET = withApi(async (request, user) => {
  const registrator = user.level === 1 ? undefined : user.username;
  const analytics = await getDashboardAnalytics(registrator);
  return NextResponse.json(analytics);
});
