import { NextRequest, NextResponse } from 'next/server';
import { generateExtendToken } from '@/lib/services/free-key-service';
import { extractClientIp } from '@/lib/utils/ip';

export async function POST(request: NextRequest) {
  try {
    const { game, registrator } = await request.json();
    if (!game || !registrator) {
      return NextResponse.json({ error: 'Game and registrator are required' }, { status: 400 });
    }

    const ip = extractClientIp(request, []);
    const result = await generateExtendToken(game, ip, registrator);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, adUrl: result.adUrl });
  } catch (error) {
    console.error('Extend request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
