import { NextRequest, NextResponse } from 'next/server';
import { getMyFreeKeyHistory } from '@/lib/services/free-key-service';
import { extractClientIp } from '@/lib/utils/ip';

export async function GET(request: NextRequest) {
  const registrator = request.nextUrl.searchParams.get('registrator');
  if (!registrator) {
    return NextResponse.json({ error: 'Missing registrator' }, { status: 400 });
  }

  const ip = extractClientIp(request, []);
  const history = await getMyFreeKeyHistory(ip, registrator);

  return NextResponse.json(history);
}
