import { getAdsAnalytics } from '@/lib/services/ads-analytics-service';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(chatId: number, text: string, parseMode: 'HTML' | 'Markdown' | 'MarkdownV2' = 'HTML') {
  if (!BOT_TOKEN) return;
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    });
    if (!response.ok) console.error('Telegram API Error:', response.status);
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

export async function setBotCommands() {
  if (!BOT_TOKEN) return false;
  try {
    const response = await fetch(`${TELEGRAM_API}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: 'Start the bot' },
          { command: 'top', description: 'Show top ad performers' },
        ],
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function handleUpdate(update: any) {
  if (!update.message?.text) return;

  const chatId = update.message.chat.id;
  const text = update.message.text.trim();

  // Always ensure commands are registered so / shows suggestions
  await setBotCommands();

  if (text === '/start') {
    await sendMessage(chatId, '<b>👋 Welcome!</b>\n\nAvailable commands:\n/top — Show top ad performers');
    return;
  }

  if (text === '/top') {
    try {
      await sendMessage(chatId, 'Fetching top performers...');
      const analytics = await getAdsAnalytics();
      const performers = analytics.topPerformers.slice(0, 10);

      if (performers.length === 0) {
        await sendMessage(chatId, '📭 No ad performer data available yet.');
        return;
      }

      let message = '<b>🏆 Top Ad Performers</b>\n\n';
      performers.forEach((p, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
        message += `${medal} <b>${p.registrator}</b> (IP)\n`;
        message += `   Keys: ${p.totalKeys} | Active: ${p.activeKeys} | Claims: ${p.adClaims}\n\n`;
      });

      await sendMessage(chatId, message);
    } catch {
      await sendMessage(chatId, '❌ Failed to fetch top performers. Please try again later.');
    }
    return;
  }

  // Unknown command
  await sendMessage(chatId, 'Use /top to see top ad performers.');
}
