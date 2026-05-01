import dbConnect from '@/lib/db/connection';
import TelegramBotState from '@/lib/db/models/TelegramBotState';
import { createReferral } from '@/lib/services/referral-service';
import { generateModderQuestion, verifyModderAnswer, askAI } from '@/lib/services/ai-service';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

// The verification question and answer
// Removed static question/answer in favor of AI
const QUESTION_TIMEOUT_MS = 60 * 1000; // 60 seconds

export async function sendMessage(chatId: number, text: string, parseMode: 'HTML' | 'Markdown' | 'MarkdownV2' = 'HTML') {
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
        parse_mode: parseMode,
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

export async function setBotCommands() {
  if (!BOT_TOKEN) return false;

  try {
    const response = await fetch(`${TELEGRAM_API}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: 'Start the bot' },
          { command: 'request_referral', description: 'Request a Level 2 Admin referral code' },
          { command: 'ask', description: 'Ask a question about the Mod Panel' },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error setting bot commands:', error);
    return false;
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
    await setBotCommands();
    await sendMessage(chatId, "<b>SYSTEM:</b> Welcome to the Mod Panel Verification Bot.\n\nAccess to Level 2 Admin is restricted to verified modders only. Use /request_referral to begin the mandatory screening process. Do not waste my time.");
    state.step = 'idle';
    state.data = {};
    await state.save();
    return;
  }

  if (text === '/request_referral') {
    if (state.hasClaimed) {
      await sendMessage(chatId, "❌ <b>ACCESS DENIED.</b>\n\nYou have already received a referral code. Each user is limited to one referral code only.");
      return;
    }
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
  
  if (text.startsWith('/ask')) {
    const query = update.message.text.substring(4).trim();
    if (!query) {
      await sendMessage(chatId, "<b>SYSTEM:</b> Please provide a question after the /ask command.\nExample: <code>/ask how to use the panel?</code>");
      return;
    }

    try {
      await sendMessage(chatId, "Thinking... 🧠");
      const systemPrompt = `You are a specialized assistant for the "Mod Panel" system. 
      Your ONLY task is to answer questions about the **Level 2 Admin** role and its responsibilities.
      
      Key Information about Level 2 Admin:
      - It is a privileged role for verified modders.
      - Level 2 Admins can generate referral codes and manage certain aspects of the panel.
      - They have access to advanced modding tools and settings.
      - Access is granted only after passing the technical screening in this bot.
      
      RULES:
      1. ONLY answer questions related to Level 2 roles and the Mod Panel system.
      2. If the question is unrelated, politely redirect them to ask about Level 2 roles.
      3. Use **Markdown** formatting (bold, italics, lists, code blocks) for all responses to make them look professional.
      4. Be concise and technical.
      
      User Question: ${query}`;
      
      const response = await askAI(systemPrompt);
      await sendMessage(chatId, response, 'Markdown');
    } catch (error) {
      console.error('Error in /ask command:', error);
      await sendMessage(chatId, "❌ SYSTEM ERROR: Failed to process your question. Please try again later.");
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
        try {
          // Create a referral code for Level 2 Admin
          console.log('Verification success. Creating referral code...');
          const referral = await createReferral(`TelegramBot:${telegramId}`, 2, 100000, 30);
          
          if (!referral || !referral.code) {
            throw new Error('Referral service returned empty code');
          }

          console.log('Referral code created:', referral.code);
          await sendMessage(chatId, `✅ <b>VERIFICATION SUCCESS.</b>\n\nYour Level 2 Admin referral code has been issued:\n<code>${referral.code}</code>\n\n<b>Wait...</b> Actually, congrats! 🎉 I'm not really harshing your welcome here in the Mod Panel, I just wanted to see if you knew your stuff! Welcome to the team!`);
          
          state.step = 'idle';
          state.data = {};
          state.hasClaimed = true;
          await state.save();
        } catch (error) {
          console.error('Error in success flow:', error);
          await sendMessage(chatId, "❌ SYSTEM ERROR: Verification passed but failed to generate code. Please contact admin.");
        }
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
          try {
            // Give code anyway even after failure - THE ULTIMATE PRANK REVEAL
            console.log('Final attempt failed. Giving code anyway as part of the prank...');
            const referral = await createReferral(`TelegramBot:${telegramId}`, 2, 100000, 30);
            
            await sendMessage(chatId, `❌ <b>FINAL REJECTION.</b> All attempts exhausted. System access denied.\n\n...\n\nJust kidding! 😂 I'm not actually harshing your welcome here in the Mod Panel. I wanted to see if you'd sweat a bit! \n\nYou're still welcome to join our team. Here is your code anyway:\n<code>${referral.code}</code>\n\nSee you inside!`);
            
            state.step = 'idle';
            state.data = {};
            state.hasClaimed = true;
            await state.save();
          } catch (error) {
            console.error('Error giving code after failure:', error);
            await sendMessage(chatId, "❌ SYSTEM ERROR: Access denied. (Actually, I was trying to give you a code but something went wrong! Try again later.)");
          }
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
