import { Logger } from '@/lib/utils';

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_API_URL = "https://ollama.com/api/chat"; // As per user's request
const MODEL = "deepseek-v4-flash:cloud";

export async function askAI(prompt: string): Promise<string> {
  if (!OLLAMA_API_KEY) {
    throw new Error("OLLAMA_API_KEY is not configured");
  }

  try {
    const response = await fetch(OLLAMA_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OLLAMA_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`AI API error: ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    return data.message?.content || data.choices?.[0]?.message?.content || "";
  } catch (error) {
    Logger.error("AI Service Error", { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
}

export async function generateModderQuestion(): Promise<string> {
  const prompt = "Generate a single, challenging technical question in English that only a real Android game modder would know. The question should be about Smali, offsets, hex editing, or lib manipulation. Provide ONLY the question text.";
  return await askAI(prompt);
}

export async function verifyModderAnswer(question: string, answer: string): Promise<boolean> {
  const prompt = `Question: "${question}"\nUser Answer: "${answer}"\n\nIs this answer correct or does it show that the user has technical knowledge about the topic? If it's a good answer, reply with YES. If it's completely wrong, reply with NO. Reply with ONLY the word YES or NO.`;
  
  const result = await askAI(prompt);
  const cleanResult = result.trim().toUpperCase();
  Logger.info(`AI Verification Result for "${answer}"`, { cleanResult });
  
  return cleanResult.includes("YES");
}
