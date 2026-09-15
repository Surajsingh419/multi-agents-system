import { getLLM } from "../llm.js";
import { tavilySearchTool } from "../tools/tavily.js";
import { scrapeWebpageTool } from "../tools/scraper.js";
import { logger } from "../utils/logger.js";

const llm = getLLM();

export async function researcherNode(state) {
  logger.agentStart("Research Agent");

  let searchResults = [];
  try {
    const tavilyData = await tavilySearchTool.invoke({ query: state.query });
    searchResults = tavilyData.results || [];
  } catch (err) {
    logger.warn(`Tavily search error: ${err.message}`);
  }

  const sources = [];
  const scrapedData = [];
  const seenDomains = new Set();

  for (const item of searchResults) {
    if (!item.url) continue;

    try {
      const domain = new URL(item.url).hostname;
      if (seenDomains.has(domain)) continue;
      seenDomains.add(domain);
    } catch {
    }

    sources.push({
      id: sources.length + 1,
      url: item.url,
      title: item.title || `Source ${sources.length + 1}`,
      snippet: item.content || "",
    });

    if (scrapedData.length < 2) {
      try {
        const pageContent = await scrapeWebpageTool.invoke({ url: item.url });
        if (pageContent && !pageContent.startsWith("Error")) {
          scrapedData.push(`### Source: ${item.title} (${item.url})\n${pageContent}`);
        }
      } catch (scrapeErr) {
        logger.warn(`Scrape skipped for ${item.url}: ${scrapeErr.message}`);
      }
    }
  }

  const prompt = `You are a Research Specialist Agent. Analyze the web search results and scraped content below to produce a comprehensive research summary on the user query.

User Query: "${state.query}"

Search Results & Snippets:
${sources.map((s, i) => `[${i + 1}] ${s.title} (${s.url})\nSummary: ${s.snippet}`).join("\n\n")}

${scrapedData.length > 0 ? "Detailed Scraped Content:\n" + scrapedData.join("\n\n") : ""}

Instructions:
- Provide an objective, fact-rich overview of the topic.
- Extract key findings, dates, figures, and verified developments.
- For every fact or claim, note which source provided it.
- Structure findings clearly with headings and bullet points.`;

  const response = await llm.invoke([
    { role: "system", content: "You are an expert Research Analyst Agent." },
    { role: "user", content: prompt },
  ]);

  const researchOutput = response.content;
  logger.agentEnd("Research Agent");

  return {
    researchData: researchOutput,
    sources,
    currentAgent: "factChecker",
    progressEvents: [
      {
        type: "progress",
        agent: "researcher",
        message: `Research complete — analyzed ${sources.length} sources`,
        timestamp: Date.now(),
      },
    ],
  };
}
