import { tool } from "@langchain/core/tools";
import * as cheerio from "cheerio";
import { z } from "zod";
import { SCRAPE_TIMEOUT_MS, MAX_SCRAPE_LENGTH } from "../config.js";
import { logger } from "../utils/logger.js";

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      clearTimeout(timeoutId);

      if (response.ok) return response;

      if (response.status === 429 || response.status === 503) {
        logger.warn(
          `Scraper: HTTP ${response.status} on attempt ${attempt}/${retries} for ${url}`
        );
        if (attempt < retries)
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }

      return response;
    } catch (error) {
      if (error.name === "AbortError") {
        logger.warn(
          `Scraper: Timeout on attempt ${attempt}/${retries} for ${url}`
        );
        if (attempt < retries)
          await new Promise((r) => setTimeout(r, 1000 * attempt));
        continue;
      }
      if (attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
  throw new Error(`All ${retries} fetch attempts failed for ${url}`);
}

function extractContent($) {
  $("script, style, nav, footer, header, aside, iframe, form, noscript").remove();

  const paragraphs = [];
  $("p").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > 20) paragraphs.push(text);
  });

  if (paragraphs.length >= 3) {
    return paragraphs.join("\n\n");
  }

  const article = $("article").text().trim() || $("main").text().trim();
  if (article.length > 100) {
    return article;
  }

  let largestText = "";
  $("div").each((_, el) => {
    const text = $(el).text().trim();
    if (text.length > largestText.length) {
      largestText = text;
    }
  });

  if (largestText.length > 100) {
    return largestText;
  }

  return $("body").text().trim();
}

export const scrapeWebpageTool = tool(
  async ({ url }) => {
    const startTime = Date.now();
    try {
      const response = await fetchWithRetry(url);

      if (!response.ok) {
        logger.scrapeResult(url, false, Date.now() - startTime);
        return `Error: HTTP ${response.status} — could not fetch ${url}`;
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const content = extractContent($);

      if (!content || content.length < 100) {
        logger.scrapeResult(url, false, Date.now() - startTime);
        return `No meaningful text content found on ${url} (content too short or empty)`;
      }

      const result =
        content.length > MAX_SCRAPE_LENGTH
          ? content.slice(0, MAX_SCRAPE_LENGTH) + "\n\n[... content truncated]"
          : content;

      logger.scrapeResult(url, true, Date.now() - startTime);
      return result;
    } catch (error) {
      logger.scrapeResult(url, false, Date.now() - startTime);
      return `Error scraping ${url}: ${error.message}`;
    }
  },
  {
    name: "scrape_webpage",
    description:
      "Fetches a webpage URL and extracts its main text content. " +
      "Use this to get the full content of a specific page found via search. " +
      "Returns the extracted text (truncated to ~3000 chars).",
    schema: z.object({
      url: z.string().url().describe("The full URL of the webpage to scrape"),
    }),
  }
);
