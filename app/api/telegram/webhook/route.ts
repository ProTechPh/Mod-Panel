import { NextRequest, NextResponse } from 'next/server';
import { handleUpdate, setBotCommands } from '@/lib/services/telegram-bot-service';
import { Logger } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const update = await request.json();
    await handleUpdate(update);
    return NextResponse.json({ success: true });
  } catch (error) {
    Logger.error('Telegram webhook error', { error: error instanceof Error ? error.message : String(error) });
    return NextResponse.json({ success: true });
  }
}

export async function GET() {
  const success = await setBotCommands();
  return NextResponse.json({
    status: 'Telegram Bot Webhook is running',
    commandsSet: success,
  });
}
