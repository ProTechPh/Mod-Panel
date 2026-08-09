import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/services/user-service';
import { setAuthCookies } from '@/lib/auth/cookies';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { registerSchema } from '@/lib/validators/auth';
import { recordFailedAttempt, clearFailedAttempts } from '@/lib/auth/brute-force';
import { verifyTurnstile } from '@/lib/auth/turnstile';
import { getClientIp } from '@/lib/utils/ip';
import { withPublicApi } from '@/lib/api/with-api';

export const POST = withPublicApi(async (request) => {
  const ip = getClientIp(request);

  const body = await request.json();
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }

  const isHuman = await verifyTurnstile(parsed.data.turnstileToken, ip);
  if (!isHuman) {
    return NextResponse.json({ error: 'Captcha verification failed. Please try again.' }, { status: 400 });
  }

  const user = await registerUser(parsed.data);
  if (!user) {
    const { delayMs } = recordFailedAttempt(ip);
    await new Promise(r => setTimeout(r, delayMs));
    return NextResponse.json({ error: 'Registration failed. Username/email may already be taken, or the referral code is invalid or expired.' }, { status: 400 });
  }

  clearFailedAttempts(ip);

  const accessToken = await signAccessToken(user.userId, user.username, user.level);
  const refreshToken = await signRefreshToken(user.userId);

  const response = NextResponse.json({
    success: true,
    accessToken,
    refreshToken,
    user: { username: user.username, level: user.level },
  });

  return setAuthCookies(response, user.userId, user.username, user.level);
});
