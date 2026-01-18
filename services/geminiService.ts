
import { GoogleGenAI, Type } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    /* Fix: Use process.env.API_KEY directly when initializing the @google/genai client instance per guidelines. */
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async analyzeMeeting(transcript: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze the following video call transcript and provide a brief summary and 3 action items: ${transcript}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              actionItems: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ['summary', 'actionItems']
          }
        }
      });
      /* Fix: Use the .text property directly instead of a method. */
      return JSON.parse(response.text);
    } catch (error) {
      console.error("Gemini analysis failed:", error);
      return null;
    }
  }

  async getAiSuggestions(context: string) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Based on this meeting context: "${context}", suggest 3 helpful talking points or questions.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            }
          }
        }
      });
      /* Fix: Use the .text property directly instead of a method. */
      return JSON.parse(response.text);
    } catch (error) {
      return { suggestions: ["Discuss project timeline", "Review recent changes", "Set next meeting"] };
    }
  }
}

export const geminiService = new GeminiService();
