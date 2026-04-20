import { NextRequest, NextResponse } from 'next/server';
import { verifyRefreshToken, signAccessToken } from '@/lib/auth/jwt';
import User from '@/lib/db/models/User';
import dbConnect from '@/lib/db/connection';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const cookieToken = request.cookies.get('wp_refresh')?.value;
  const refreshToken = bearerToken || cookieToken;

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 });
  }

  try {
    const { userId } = await verifyRefreshToken(refreshToken);

    await dbConnect();
    const user = await User.findById(userId).select('status level username').lean();
    if (!user || user.status !== 1) {
      const response = NextResponse.json({ error: 'User not found or account disabled' }, { status: 401 });
      response.cookies.set('wp_access', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
      response.cookies.set('wp_refresh', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
      return response;
    }

    const accessToken = await signAccessToken(userId, user.username, user.level);
    const response = NextResponse.json({ success: true, accessToken });
    response.cookies.set('wp_access', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 6 * 60 * 60,
    });
    return response;
  } catch {
    const response = NextResponse.json({ error: 'Invalid refresh token' }, { status: 401 });
    response.cookies.set('wp_access', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
    response.cookies.set('wp_refresh', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', maxAge: 0 });
    return response;
  }
}