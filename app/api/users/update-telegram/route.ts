import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth/middleware';
import { updateUser } from '@/lib/services/user-service';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  const user = await authenticate(request);
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await request.json();
    const { telegramContact } = body;

    if (!telegramContact) {
      return NextResponse.json({ error: 'Telegram contact is required' }, { status: 400 });
    }

    const updated = await updateUser(user.userId, { telegramContact });
    if (!updated) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    return NextResponse.json({ success: true, user: { telegramContact: updated.telegramContact } });
  } catch (error) {
    Logger.error('Update telegram error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}