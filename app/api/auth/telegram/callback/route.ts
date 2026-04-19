import { NextRequest, NextResponse } from 'next/server';
import { loginWithTelegram } from '@/lib/services/user-service';
import { setAuthCookies } from '@/lib/auth/cookies';
import { verifyTelegramAuth, isAuthDateValid } from '@/lib/auth/telegram';
import { telegramCallbackSchema } from '@/lib/validators/auth';
import dbConnect from '@/lib/db/connection';
import TelegramAuthLog from '@/lib/db/models/TelegramAuthLog';

async function handleTelegramLogin(data: Record<string, string>) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: 'Telegram login is not configured' }, { status: 500 });
  }

  const parsed = telegramCallbackSchema.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  if (!verifyTelegramAuth(parsed.data, botToken)) {
    return NextResponse.json({ error: 'Invalid Telegram authentication data' }, { status: 401 });
  }

  if (!isAuthDateValid(parsed.data.auth_date)) {
    return NextResponse.json({ error: 'Telegram authentication data has expired' }, { status: 401 });
  }

  // Prevent replay: reject already-used hashes
  await dbConnect();
  const existingLog = await TelegramAuthLog.findOne({ hash: parsed.data.hash }).lean();
  if (existingLog) {
    return NextResponse.json({ error: 'This Telegram login has already been used' }, { status: 401 });
  }

  await TelegramAuthLog.create({ hash: parsed.data.hash });

  const telegramId = parseInt(parsed.data.id, 10);
  const user = await loginWithTelegram(telegramId);

  if (!user) {
    return NextResponse.json({
      error: 'No account linked to this Telegram. Please register first, then connect your Telegram in Settings.',
      code: 'TELEGRAM_NOT_LINKED',
    }, { status: 404 });
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
}

export async function GET(request: NextRequest) {
  try {
    const params = Object.fromEntries(request.nextUrl.searchParams);
    return await handleTelegramLogin(params);
  } catch (error) {
    console.error('Telegram login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return await handleTelegramLogin(body);
  } catch (error) {
    console.error('Telegram login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}