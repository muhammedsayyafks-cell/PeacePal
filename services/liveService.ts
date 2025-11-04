import { LiveSession, Modality, LiveCallbacks } from '@google/genai';
import { getAi } from './geminiService';
import { SYSTEM_PROMPT } from '../constants';

/**
 * Connects to the Gemini Live API and establishes a real-time voice session.
 * @param callbacks Callbacks for handling session events (onmessage, onerror, onclose).
 * @returns A promise that resolves with the active LiveSession object.
 */
export const connectToLive = (callbacks: LiveCallbacks): Promise<LiveSession> => {
  const ai = getAi();
  if (!ai) {
    return Promise.reject(new Error("GoogleGenAI not initialized."));
  }

  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    },
  });

  return sessionPromise;
};
