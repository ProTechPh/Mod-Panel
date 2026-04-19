import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { connectTelegram } from '@/lib/services/user-service';
import { verifyTelegramAuth, isAuthDateValid } from '@/lib/auth/telegram';
import { telegramCallbackSchema } from '@/lib/validators/auth';

export async function POST(request: NextRequest) {
  try {
    const authUser = await authenticate(request);
    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json({ error: 'Telegram login is not configured' }, { status: 500 });
    }

    const body = await request.json();
    const parsed = telegramCallbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    if (!verifyTelegramAuth(parsed.data, botToken)) {
      return NextResponse.json({ error: 'Invalid Telegram authentication data' }, { status: 401 });
    }

    if (!isAuthDateValid(parsed.data.auth_date)) {
      return NextResponse.json({ error: 'Telegram authentication data has expired' }, { status: 401 });
    }

    const telegramId = parseInt(parsed.data.id, 10);
    const result = await connectTelegram(authUser.userId, telegramId, parsed.data.username || '');

    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (result.error === 'already_linked') {
      return NextResponse.json({ error: 'This Telegram account is already linked to another panel account' }, { status: 409 });
    }

    return NextResponse.json({
      success: true,
      user: { telegramId, telegramUsername: parsed.data.username || '' },
    });
  } catch (error) {
    console.error('Telegram connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}