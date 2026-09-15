import dotenv from "dotenv";

dotenv.config();

const requiredKeys = ["GOOGLE_API_KEY", "TAVILY_API_KEY"];

for (const key of requiredKeys) {
  if (!process.env[key] || process.env[key].startsWith("your_")) {
    console.error(
      `\n❌ Missing or placeholder value for ${key}.\n` +
      `   1. Copy .env.example to .env:  cp .env.example .env\n` +
      `   2. Fill in your real API key.\n`
    );
    process.exit(1);
  }
}

export const GEMINI_MODEL = "gemini-3.5-flash";
export const LLM_TEMPERATURE = 0;
export const MAX_SEARCH_RESULTS = 3;
export const SCRAPE_TIMEOUT_MS = 10_000;
export const MAX_SCRAPE_LENGTH = 3000;
export const MAX_ITERATIONS = 10;

export const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
export const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
