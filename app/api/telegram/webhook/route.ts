import { NextRequest, NextResponse } from 'next/server';
import { handleUpdate, setBotCommands } from '@/lib/services/telegram-bot-service';

export async function POST(request: NextRequest) {
  try {
    // Basic security: check if it's actually from Telegram
    // In a real production app, you might want to check the X-Telegram-Bot-Api-Secret-Token header
    // if you set a secret when setting the webhook.
    
    const update = await request.json();
    
    // We don't want to block Telegram while we process the update
    // But since this is serverless, we should await or use a queue.
    // For simplicity, we await here.
    await handleUpdate(update);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Always return 200 to Telegram so it doesn't keep retrying failed updates
    return NextResponse.json({ success: true });
  }
}

// Optionally handle GET for simple status check or webhook setup
export async function GET() {
  const success = await setBotCommands();
  return NextResponse.json({ 
    status: 'Telegram Bot Webhook is running',
    commandsSet: success 
  });
}
