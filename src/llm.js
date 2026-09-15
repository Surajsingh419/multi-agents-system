import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { GOOGLE_API_KEY, GEMINI_MODEL, LLM_TEMPERATURE } from "./config.js";

export function getLLM() {
  return new ChatGoogleGenerativeAI({
    apiKey: GOOGLE_API_KEY,
    model: GEMINI_MODEL,
    temperature: LLM_TEMPERATURE,
    maxRetries: 5,
  });
}
