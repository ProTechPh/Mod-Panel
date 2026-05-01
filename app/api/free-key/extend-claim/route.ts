import { NextRequest, NextResponse } from 'next/server';
import { extendFreeKey } from '@/lib/services/free-key-service';
import { extractClientIp } from '@/lib/utils/ip';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const ip = extractClientIp(request, []);
    const result = await extendFreeKey(token, ip);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, game: result.game });
  } catch (error) {
    console.error('Extend claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
