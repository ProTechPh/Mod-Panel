import dbConnect from '@/lib/db/connection';
import TelegramBotState from '@/lib/db/models/TelegramBotState';
import { createReferral } from '@/lib/services/referral-service';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// The verification question and answer
const VERIFICATION_QUESTION = "Verification: Ano ang file extension ng compiled Java code sa Android? (Hint: 3 letters)";
const VERIFICATION_ANSWER = "dex";

export async function sendMessage(chatId: number, text: string) {
  if (!BOT_TOKEN) return;
  
  try {
    await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

export async function handleUpdate(update: any) {
  if (!update.message || !update.message.text) return;

  const chatId = update.message.chat.id;
  const telegramId = update.message.from.id;
  const text = update.message.text.trim().toLowerCase();

  await dbConnect();

  let state = await TelegramBotState.findOne({ telegramId });
  if (!state) {
    state = await TelegramBotState.create({ telegramId, step: 'idle' });
  }

  if (text === '/start') {
    await sendMessage(chatId, "Welcome to Mod Panel Bot! Gamitin ang /request_referral para makakuha ng Level 2 Admin referral code.");
    state.step = 'idle';
    await state.save();
    return;
  }

  if (text === '/request_referral') {
    await sendMessage(chatId, VERIFICATION_QUESTION);
    state.step = 'awaiting_verification';
    await state.save();
    return;
  }

  if (state.step === 'awaiting_verification') {
    if (text === VERIFICATION_ANSWER) {
      // Create a referral code for Level 2 Admin
      // Level: 2 (Admin)
      // Set Saldo: 0 (or whatever default)
      // Expiration: 7 days
      try {
        const referral = await createReferral('TelegramBot', 2, 0, 7);
        await sendMessage(chatId, `✅ <b>Verification Success!</b>\n\nIto ang iyong referral code para sa Level 2 Admin:\n<code>${referral.code}</code>\n\nGamitin ito sa registration page.`);
        state.step = 'idle';
        await state.save();
      } catch (error) {
        console.error('Error creating referral via bot:', error);
        await sendMessage(chatId, "❌ May error sa pag-generate ng referral code. Subukan ulit mamaya.");
      }
    } else {
      await sendMessage(chatId, "❌ Mali ang iyong sagot. Pakisubukan ulit. Kung hindi mo alam ang sagot, baka hindi ka tunay na modder.");
    }
    return;
  }

  // Default response
  if (state.step === 'idle') {
    await sendMessage(chatId, "Gamitin ang /request_referral para makakuha ng referral code.");
  }
}
