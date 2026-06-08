import { NextRequest, NextResponse } from 'next/server';
import { getMyFreeKeyHistory } from '@/lib/services/free-key-service';
import { authenticate } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const registrator = request.nextUrl.searchParams.get('registrator');
  if (!registrator) {
    return NextResponse.json({ error: 'Missing registrator' }, { status: 400 });
  }

  const user = await authenticate(request);
  if (!user?.username) {
    return NextResponse.json([]);
  }

  const history = await getMyFreeKeyHistory(user.username, registrator);
  return NextResponse.json(history);
}
