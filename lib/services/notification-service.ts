import dbConnect from '@/lib/db/connection';
import TelegramBotState from '@/lib/db/models/TelegramBotState';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const EVENT_EMOJI: Record<string, string> = {
  'key.generated': '🔑',
  'key.expired': '⏰',
  'key.expiring_soon': '⚠️',
  'maintenance.toggled': '🔧',
  'user.registered': '👤',
  'order.paid': '💰',
};

const EVENT_LABEL: Record<string, string> = {
  'key.generated': 'Key Generated',
  'key.expired': 'Key Expired',
  'key.expiring_soon': 'Key Expiring Soon',
  'maintenance.toggled': 'Maintenance Toggled',
  'user.registered': 'User Registered',
  'order.paid': 'Order Paid',
};

function formatMessage(event: string, data: Record<string, any>): string {
  const emoji = EVENT_EMOJI[event] || '📢';
  const label = EVENT_LABEL[event] || event;

  let body = '';
  for (const [key, value] of Object.entries(data)) {
    const formatted = typeof value === 'object' ? JSON.stringify(value) : String(value);
    body += `  <b>${key}:</b> ${formatted}\n`;
  }

  return `${emoji} <b>${label}</b>\n\n${body.trim()}`;
}

async function sendTelegram(chatId: number, text: string): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
    return false;
  }
}

export async function sendNotification(
  event: string,
  data: Record<string, any>
): Promise<{ sent: boolean; channels: string[] }> {
  const channels: string[] = [];

  await dbConnect();

  if (BOT_TOKEN) {
    const subscribers = await TelegramBotState.find({ hasClaimed: true }).lean();
    if (subscribers.length > 0) {
      const text = formatMessage(event, data);
      const results = await Promise.all(
        subscribers.map((sub) => sendTelegram(sub.telegramId, text))
      );
      if (results.some(Boolean)) channels.push('telegram');
    }
  }

  return { sent: channels.length > 0, channels };
}
