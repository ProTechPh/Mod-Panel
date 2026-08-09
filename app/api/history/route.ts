import { NextResponse } from 'next/server';
import { withApi } from '@/lib/api/with-api';
import { getHistory, clearHistory } from '@/lib/services/history-service';

export const GET = withApi(async (request, user) => {
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10);
  const type = request.nextUrl.searchParams.get('type');

  const history = await getHistory(
    type || (user.level === 1 ? undefined : user.username),
    limit
  );
  return NextResponse.json(history);
});

export const DELETE = withApi(async (request, user) => {
  const clearAll = request.nextUrl.searchParams.get('all') === 'true';
  const type = request.nextUrl.searchParams.get('type');

  await clearHistory(type || (clearAll && user.level === 1 ? undefined : user.username));
  return NextResponse.json({ success: true });
});
