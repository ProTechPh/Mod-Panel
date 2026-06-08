import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/services/user-service';
import { setAuthCookies } from '@/lib/auth/cookies';
import { signAccessToken, signRefreshToken } from '@/lib/auth/jwt';
import { loginSchema } from '@/lib/validators/auth';
import { recordFailedAttempt, clearFailedAttempts } from '@/lib/auth/brute-force';
import { verifyTurnstile } from '@/lib/auth/turnstile';
import { logAudit } from '@/lib/services/audit-service';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-client-ip') || 'unknown';

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const isHuman = await verifyTurnstile(parsed.data.turnstileToken, ip);
    if (!isHuman) {
      return NextResponse.json({ error: 'Captcha verification failed. Please try again.' }, { status: 400 });
    }

    const user = await loginUser(parsed.data.identifier, parsed.data.password);
    if (!user) {
      logAudit({ action: 'auth.failed_login', actor: parsed.data.identifier, actorLevel: 0, details: { reason: 'invalid credentials' }, ip });
      const { delayMs } = recordFailedAttempt(ip);
      await new Promise(r => setTimeout(r, delayMs));
      return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
    }

    if (user.status !== 1) {
      return NextResponse.json({ error: 'Account is banned or expired' }, { status: 403 });
    }

    if (new Date(user.expirationDate) < new Date()) {
      return NextResponse.json({ error: 'Account has expired' }, { status: 403 });
    }

    clearFailedAttempts(ip);

    logAudit({ action: 'auth.login', actor: user.username, actorLevel: user.level, ip });

    const accessToken = await signAccessToken(user.userId, user.username, user.level);
    const refreshToken = await signRefreshToken(user.userId);

    const response = NextResponse.json({
      success: true,
      accessToken,
      refreshToken,
      user: { username: user.username, level: user.level, fullname: user.fullname, saldo: user.saldo },
    });

    return setAuthCookies(response, user.userId, user.username, user.level);
  } catch (error) {
    Logger.error('Login error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}