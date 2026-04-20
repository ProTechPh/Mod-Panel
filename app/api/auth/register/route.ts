import { NextRequest, NextResponse } from 'next/server';
import { registerUser } from '@/lib/services/user-service';
import { setAuthCookies } from '@/lib/auth/cookies';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { registerSchema } from '@/lib/validators/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const user = await registerUser(parsed.data);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or already used referral code, or username/email taken' }, { status: 400 });
    }

    const accessToken = await signAccessToken(user.userId, user.username, user.level);
    const refreshToken = await signRefreshToken(user.userId);

    const response = NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: { username: user.username, level: user.level },
    });

    return setAuthCookies(response, user.userId, user.username, user.level);
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}