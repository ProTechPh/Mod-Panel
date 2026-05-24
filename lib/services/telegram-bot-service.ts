import { getAdsAnalytics } from '@/lib/services/ads-analytics-service';
import dbConnect from '@/lib/db/connection';
import Key from '@/lib/db/models/Key';

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
          { command: 'status', description: 'Show user online/offline status' },
        ],
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function isCommand(text: string, command: string): boolean {
  if (!text.startsWith('/')) return false;
  const withoutPrefix = text.slice(1).split(' ')[0];
  const cmdName = withoutPrefix.split('@')[0];
  return cmdName === command;
}

export async function handleUpdate(update: any) {
  if (!update.message?.text) return;

  const chatId = update.message.chat.id;
  const text = update.message.text.trim();

  // Always ensure commands are registered so / shows suggestions
  await setBotCommands();

  if (isCommand(text, 'start')) {
    await sendMessage(chatId, '<b>👋 Welcome!</b>\n\nAvailable commands:\n/top — Show top ad performers');
    return;
  }

  if (isCommand(text, 'top')) {
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

  if (isCommand(text, 'status')) {
    try {
      await sendMessage(chatId, 'Fetching user status...');
      const message = await getStatusReport();
      await sendMessage(chatId, message);
    } catch {
      await sendMessage(chatId, '❌ Failed to fetch status. Please try again later.');
    }
    return;
  }

  // Unknown command
  await sendMessage(chatId, 'Use /top to see top ad performers.');
}

async function getStatusReport(): Promise<string> {
  await dbConnect();
  const now = new Date();

  const results = await Key.aggregate([
    {
      $group: {
        _id: '$registrator',
        totalKeys: { $sum: 1 },
        activeKeys: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$status', 1] },
                { $or: [
                  { $eq: ['$expiredDate', null] },
                  { $gt: ['$expiredDate', now] },
                ]},
              ]},
              1, 0,
            ],
          },
        },
        connectedKeys: {
          $sum: {
            $cond: [
              { $and: [
                { $eq: ['$status', 1] },
                { $gt: [{ $size: { $ifNull: ['$devices', []] } }, 0] },
                { $or: [
                  { $eq: ['$expiredDate', null] },
                  { $gt: ['$expiredDate', now] },
                ]},
              ]},
              1, 0,
            ],
          },
        },
        freeKeys: {
          $sum: { $cond: [{ $eq: ['$isFreeKey', true] }, 1, 0] },
        },
      },
    },
    { $sort: { connectedKeys: -1, activeKeys: -1 } },
  ]);

  if (results.length === 0) {
    return '📭 No user data found.';
  }

  const top = results.slice(0, 20);
  let message = '<b>📊 User Status</b>\n\n';

  for (const row of top) {
    const offlineActive = row.activeKeys - row.connectedKeys;
    const icon = row.connectedKeys > 0 ? '🟢' : '🔴';
    const label = row.connectedKeys > 0 ? 'Online' : 'Offline';

    message += `${icon} <b>${row._id}</b> — ${label}\n`;
    message += `   Keys: ${row.totalKeys} total · ${row.activeKeys} active\n`;
    message += `   Connected: ${row.connectedKeys} · Disconnected: ${offlineActive}\n`;

    if (row.freeKeys > 0) {
      message += `   🆓 Free Key\n`;
    }
    message += '\n';
  }

  message += `<b>📌 Summary</b>\n`;
  message += `Total registrators: ${results.length}`;
  if (results.length > 20) {
    message += ` (showing top 20)`;
  }

  return message;
}
