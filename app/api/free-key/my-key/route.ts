import { NextRequest, NextResponse } from 'next/server';
import { getMyFreeKey } from '@/lib/services/free-key-service';

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-client-ip') || 'unknown';
  const registrator = request.nextUrl.searchParams.get('registrator');

  if (!registrator) {
    return NextResponse.json({ error: 'Missing registrator' }, { status: 400 });
  }

  const result = await getMyFreeKey(ip, registrator);
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json(result);
}
