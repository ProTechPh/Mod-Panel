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
    await sendMessage(chatId, "<b>SYSTEM:</b> Welcome to the Mod Panel Verification Bot.\n\nAccess to Level 2 Admin is restricted to verified modders only. Use /request_referral to begin the mandatory screening process. Do not waste my time.");
    state.step = 'idle';
    state.data = {};
    await state.save();
    return;
  }

  if (text === '/request_referral') {
    try {
      await sendMessage(chatId, "<b>SCREENING STARTED.</b>\n\nYou will be asked a series of technical questions. You have exactly 3 attempts. Failure to provide accurate answers will result in rejection.");
      await sendMessage(chatId, "Retrieving technical challenge... ⏳");
      
      const question = await generateModderQuestion();
      await sendMessage(chatId, `<b>CHALLENGE #1:</b>\n${question}`);
      
      state.step = 'awaiting_verification';
      state.data = { 
        question, 
        attempts: 1,
        expiresAt: Date.now() + QUESTION_TIMEOUT_MS 
      };
      await state.save();
      
      await sendMessage(chatId, "⏱ <b>60 SECONDS REMAINING.</b> Answer now.");
    } catch (error) {
      console.error('Error generating AI question:', error);
      await sendMessage(chatId, "❌ SYSTEM ERROR: Failed to retrieve challenge. Re-initialize /request_referral.");
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
        await sendMessage(chatId, "❌ <b>SESSION EXPIRED.</b> You failed to respond within the allocated time.\n\n<i>(P.S. Joke lang! I'm not actually harshing your welcome here in the Mod Panel. You can try again whenever you want with /request_referral!)</i>");
        state.step = 'idle';
        state.data = {};
        await state.save();
        return;
      }

      await sendMessage(chatId, "Analyzing response... 🔍");
      const isCorrect = await verifyModderAnswer(question, text);
      
      if (isCorrect) {
        // Create a referral code for Level 2 Admin
        const referral = await createReferral('TelegramBot', 2, 0, 7);
        await sendMessage(chatId, `✅ <b>VERIFICATION SUCCESS.</b>\n\nYour Level 2 Admin referral code has been issued:\n<code>${referral.code}</code>\n\n<b>Wait...</b> Actually, congrats! 🎉 I'm not really harshing your welcome here in the Mod Panel, I just wanted to see if you knew your stuff! Welcome to the team!`);
        state.step = 'idle';
        state.data = {};
        await state.save();
      } else {
        const attempts = (state.data?.attempts || 1);
        if (attempts < 3) {
          await sendMessage(chatId, `❌ <b>INCORRECT.</b> Attempt ${attempts}/3 failed. Generating secondary challenge...`);
          
          const nextQuestion = await generateModderQuestion();
          await sendMessage(chatId, `<b>CHALLENGE #${attempts + 1}:</b>\n${nextQuestion}`);
          
          state.data = { 
            question: nextQuestion, 
            attempts: attempts + 1,
            expiresAt: Date.now() + QUESTION_TIMEOUT_MS 
          };
          await state.save();
        } else {
          await sendMessage(chatId, "❌ <b>FINAL REJECTION.</b> All attempts exhausted. System access denied.\n\n...\n\nJust kidding! 😂 I'm not harshing your welcome here in the Mod Panel. You're still welcome to join, just ask me if you have any questions about how it works!");
          state.step = 'idle';
          state.data = {};
          await state.save();
        }
      }
    } catch (error) {
      console.error('Error verifying AI answer:', error);
      await sendMessage(chatId, "❌ CRITICAL ERROR: Verification system offline.");
    }
    return;
  }

  // Default response
  if (state.step === 'idle') {
    await sendMessage(chatId, "Use /request_referral to get a referral code.");
  }
}
