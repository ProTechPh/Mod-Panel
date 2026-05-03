import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { getHistory, clearHistory } from '@/lib/services/history-service';

export async function GET(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100', 10);
  const type = request.nextUrl.searchParams.get('type');

  const history = await getHistory(
    type || (user.level === 1 ? undefined : user.username),
    limit
  );
  return NextResponse.json(history);
}

export async function DELETE(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const clearAll = request.nextUrl.searchParams.get('all') === 'true';
  const type = request.nextUrl.searchParams.get('type');

  await clearHistory(type || (clearAll && user.level === 1 ? undefined : user.username));
  return NextResponse.json({ success: true });
}