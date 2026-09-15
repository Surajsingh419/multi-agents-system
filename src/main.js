import readline from "readline";
import { runResearchPipeline } from "./graph/workflow.js";
import { startServer } from "./server.js";
import { logger } from "./utils/logger.js";
import "./config.js";

const args = process.argv.slice(2);
const isServerMode = args.includes("--server") || args.includes("-s");

if (isServerMode) {
  startServer();
} else {
  runCLI();
}

async function getQuery() {
  const queryArgs = args.filter((a) => !a.startsWith("-")).join(" ").trim();
  if (queryArgs) return queryArgs;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question("\n🔬 Enter your research query: ", (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function runCLI() {
  console.log("\n" + "═".repeat(60));
  console.log("  🤖 Multi-Agent Research System v2.0");
  console.log("  Powered by Google Gemini + Tavily + Cheerio");
  console.log("  Agents: Research → Fact-Check → Write");
  console.log("═".repeat(60));

  const query = await getQuery();

  if (!query) {
    console.error("\n❌ No query provided. Please enter a research topic.\n");
    process.exit(1);
  }

  console.log(`\n📌 Research Topic: "${query}"\n`);

  const startTime = Date.now();

  try {
    const { report, sources, metrics } = await runResearchPipeline(
      query,
      (event) => {
        if (event.type === "progress") {
          logger.progress(`[${event.agent}] ${event.message}`);
        }
      }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log("\n" + "═".repeat(60));
    console.log("  📊 FINAL RESEARCH REPORT");
    console.log("═".repeat(60) + "\n");
    console.log(report);
    console.log("\n" + "═".repeat(60));
    console.log(`  ⏱️  Completed in ${elapsed}s`);
    console.log(`  📚 Sources: ${sources.length}`);
    console.log("═".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ An error occurred during research:\n");
    console.error(`   ${error.message}\n`);

    if (
      error.message.includes("401") ||
      error.message.includes("Unauthorized") ||
      error.message.includes("API_KEY")
    ) {
      console.error(
        "   💡 Hint: Check your GOOGLE_API_KEY in the .env file.\n"
      );
    } else if (error.message.includes("TAVILY")) {
      console.error(
        "   💡 Hint: Check your TAVILY_API_KEY in the .env file.\n"
      );
    } else if (error.message.includes("rate limit")) {
      console.error(
        "   💡 Hint: You've hit an API rate limit. Wait a moment and try again.\n"
      );
    }

    process.exit(1);
  }
}
