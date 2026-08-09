import { NextRequest, NextResponse } from 'next/server';
import { claimFreeKey } from '@/lib/services/free-key-service';
import { extractClientIp } from '@/lib/utils/ip';

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    let deviceId = request.cookies.get('free_key_device_id')?.value;
    if (!deviceId) {
      deviceId = crypto.randomUUID();
    }

    const ip = extractClientIp(request, []);
    const result = await claimFreeKey(token, ip, deviceId);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, key: result.key, game: result.game });
    response.cookies.set('free_key_device_id', deviceId, {
      maxAge: 365 * 24 * 60 * 60, // 1 year
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return response;
  } catch (error) {
    console.error('Claim key error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
