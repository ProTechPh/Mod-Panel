import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/services/user-service';
import { setAuthCookies } from '@/lib/auth/cookies';
import { loginSchema } from '@/lib/validators/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
    }

    const user = await loginUser(parsed.data.identifier, parsed.data.password);
    if (!user) {
      return NextResponse.json({ error: 'Invalid username/email or password' }, { status: 401 });
    }

    if (user.status !== 1) {
      return NextResponse.json({ error: 'Account is banned or expired' }, { status: 403 });
    }

    if (new Date(user.expirationDate) < new Date()) {
      return NextResponse.json({ error: 'Account has expired' }, { status: 403 });
    }

    const response = NextResponse.json({
      success: true,
      user: { username: user.username, level: user.level, fullname: user.fullname, saldo: user.saldo },
    });

    return setAuthCookies(response, user.userId, user.username, user.level);
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}