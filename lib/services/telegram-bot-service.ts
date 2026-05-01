import dbConnect from '@/lib/db/connection';
import TelegramBotState from '@/lib/db/models/TelegramBotState';
import { createReferral } from '@/lib/services/referral-service';
import { generateModderQuestion, verifyModderAnswer } from '@/lib/services/ai-service';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// The verification question and answer
// Removed static question/answer in favor of AI
const QUESTION_TIMEOUT_MS = 60 * 1000; // 60 seconds

export async function sendMessage(chatId: number, text: string) {
  if (!BOT_TOKEN) {
    console.error('TELEGRAM_BOT_TOKEN is missing!');
    return;
  }
  
  try {
    console.log(`Sending message to ${chatId}: ${text.substring(0, 50)}...`);
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`Telegram API Error: ${response.status}`, errorData);
    }
  } catch (error) {
    console.error('Error sending Telegram message:', error);
  }
}

export async function handleUpdate(update: any) {
  console.log('Received Telegram Update:', JSON.stringify(update));
  if (!update.message || !update.message.text) {
    console.log('Update ignored: No message text');
    return;
  }

  const chatId = update.message.chat.id;
  const telegramId = update.message.from.id;
  const text = update.message.text.trim().toLowerCase();

  await dbConnect();

  let state = await TelegramBotState.findOne({ telegramId });
  if (!state) {
    state = await TelegramBotState.create({ telegramId, step: 'idle' });
  }

  if (text === '/start') {
    await sendMessage(chatId, "Welcome to Mod Panel Bot! Use /request_referral to get a Level 2 Admin referral code.");
    state.step = 'idle';
    await state.save();
    return;
  }

  if (text === '/request_referral') {
    try {
      await sendMessage(chatId, "Please wait, generating a verification question for you...");
      const question = await generateModderQuestion();
      await sendMessage(chatId, `<b>Verification Question:</b>\n${question}`);
      
      state.step = 'awaiting_verification';
      state.data = { 
        question, 
        expiresAt: Date.now() + QUESTION_TIMEOUT_MS 
      };
      await state.save();
      
      await sendMessage(chatId, "⏱ <b>Timer started:</b> You have 60 seconds to answer.");
    } catch (error) {
      console.error('Error generating AI question:', error);
      await sendMessage(chatId, "❌ I couldn't generate a question right now. Please try again later.");
    }
    return;
  }

  if (state.step === 'awaiting_verification') {
    const question = state.data?.question;
    if (!question) {
      await sendMessage(chatId, "Something went wrong. Gamitin ulit ang /request_referral.");
      state.step = 'idle';
      await state.save();
      return;
    }

    try {
      // Check for timeout
      const expiresAt = state.data?.expiresAt;
      if (expiresAt && Date.now() > expiresAt) {
        await sendMessage(chatId, "⏰ <b>Time's up!</b> You took too long to answer. Use /request_referral to try again with a new question.");
        state.step = 'idle';
        state.data = {};
        await state.save();
        return;
      }

      await sendMessage(chatId, "Checking your answer... 🔍");
      const isCorrect = await verifyModderAnswer(question, text);
      
      if (isCorrect) {
        // Create a referral code for Level 2 Admin
        const referral = await createReferral('TelegramBot', 2, 0, 7);
        await sendMessage(chatId, `✅ <b>Verification Success!</b>\n\nHere is your Level 2 Admin referral code:\n<code>${referral.code}</code>\n\nUse this on the registration page.`);
        state.step = 'idle';
        state.data = {};
        await state.save();
      } else {
        await sendMessage(chatId, "❌ Your answer is incorrect or insufficient. Please use /request_referral again for a new question.");
        state.step = 'idle';
        state.data = {};
        await state.save();
      }
    } catch (error) {
      console.error('Error verifying AI answer:', error);
      await sendMessage(chatId, "❌ There was an error verifying your answer. Please try again later.");
    }
    return;
  }

  // Default response
  if (state.step === 'idle') {
    await sendMessage(chatId, "Use /request_referral to get a referral code.");
  }
}
