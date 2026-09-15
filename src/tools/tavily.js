import { TavilySearch } from "@langchain/tavily";
import { TAVILY_API_KEY, MAX_SEARCH_RESULTS } from "../config.js";

export const tavilySearchTool = new TavilySearch({
  apiKey: TAVILY_API_KEY,
  maxResults: MAX_SEARCH_RESULTS,
});
