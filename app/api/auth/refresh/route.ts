import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken } from '@/lib/auth/jwt';
import { setAuthCookies } from '@/lib/auth/cookies';
import User from '@/lib/db/models/User';

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get('wp_refresh')?.value;
  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    const { userId } = await verifyRefreshToken(refreshToken);

    // Verify user exists and is still active
    const user = await User.findById(userId).select('status level');
    if (!user || user.status !== 1) {
      return NextResponse.json({ error: 'User not found or account disabled' }, { status: 401 });
    }

    const accessToken = await signAccessToken(userId, '', 1);
    const response = NextResponse.json({ success: true });
    response.cookies.set('wp_access', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 6 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
  }
}