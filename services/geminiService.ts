import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import type { ChatHistoryPart } from '../types';

let ai: GoogleGenAI | null = null;

export const getAi = () => {
  if (!ai) {
    if (process.env.API_KEY) {
      ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    } else {
      console.error("Gemini API key is not configured.");
      return null;
    }
  }
  return ai;
}

export const getGeminiResponse = async (userMessage: string, history: ChatHistoryPart[], isThinkingMode: boolean): Promise<string> => {
  const genAI = getAi();
  if (!genAI) {
    return "My apologies, I'm having trouble connecting to my cognitive functions right now.";
  }

  const modelName = isThinkingMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  
  const config: {
    systemInstruction: string;
    thinkingConfig?: { thinkingBudget: number };
  } = {
    systemInstruction: SYSTEM_PROMPT,
  };

  if (isThinkingMode) {
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  try {
    const response: GenerateContentResponse = await genAI.models.generateContent({
        model: modelName,
        contents: [...history, { role: 'user', parts: [{ text: userMessage }] }],
        config,
    });

    return response.text || "I'm not sure what to say.";
  } catch (error) {
    console.error("Error getting Gemini response:", error);
    return "I'm having a little trouble thinking right now. Could you try saying that again?";
  }
};