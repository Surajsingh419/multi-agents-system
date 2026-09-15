import { StateGraph } from "@langchain/langgraph";
import { ResearchState } from "./state.js";
import { researcherNode } from "../agents/researcher.js";
import { factCheckerNode } from "../agents/factChecker.js";
import { writerNode } from "../agents/writer.js";
import { logger } from "../utils/logger.js";

function buildWorkflow() {
  const workflow = new StateGraph(ResearchState)
    .addNode("researcher", researcherNode)
    .addNode("factChecker", factCheckerNode)
    .addNode("writer", writerNode)
    .addEdge("__start__", "researcher")
    .addEdge("researcher", "factChecker")
    .addEdge("factChecker", "writer")
    .addEdge("writer", "__end__");

  return workflow.compile();
}

const researchWorkflow = buildWorkflow();

export async function runResearchPipeline(query, onProgress = null) {
  logger.reset();
  logger.progress(`Starting research for: "${query}"`);

  if (onProgress) {
    onProgress({
      type: "progress",
      agent: "system",
      message: "Starting multi-agent research pipeline...",
      timestamp: Date.now(),
    });
  }

  const result = await researchWorkflow.invoke({
    query,
    researchData: "",
    sources: [],
    factCheckResults: "",
    finalReport: "",
    currentAgent: "researcher",
    progressEvents: [],
  });

  if (onProgress && result.progressEvents) {
    for (const event of result.progressEvents) {
      onProgress(event);
    }
  }

  logger.printSummary();

  return {
    report: result.finalReport,
    sources: result.sources,
    metrics: logger.getMetrics(),
  };
}

export async function streamResearchPipeline(query, onEvent) {
  logger.reset();

  onEvent({
    type: "progress",
    agent: "system",
    message: "Initializing multi-agent research system...",
  });

  onEvent({
    type: "progress",
    agent: "researcher",
    message: "Research Agent is searching the web and analyzing sources...",
    timestamp: Date.now(),
  });

  try {
    const stream = await researchWorkflow.stream(
      {
        query,
        researchData: "",
        sources: [],
        factCheckResults: "",
        finalReport: "",
        currentAgent: "researcher",
        progressEvents: [],
      },
      { streamMode: "updates" }
    );

    for await (const update of stream) {
      for (const [nodeName, stateUpdate] of Object.entries(update)) {
        if (stateUpdate.progressEvents) {
          for (const event of stateUpdate.progressEvents) {
            onEvent(event);
          }
        }

        if (stateUpdate.sources && stateUpdate.sources.length > 0) {
          onEvent({
            type: "sources",
            sources: stateUpdate.sources,
          });
        }

        if (nodeName === "researcher") {
          onEvent({
            type: "progress",
            agent: "factchecker",
            message: "Fact-Checker Agent is cross-verifying claims and source authority...",
            timestamp: Date.now(),
          });
        } else if (nodeName === "factChecker") {
          onEvent({
            type: "progress",
            agent: "writer",
            message: "Writer Agent is structuring final report with citations...",
            timestamp: Date.now(),
          });
        }

        if (nodeName === "writer" && stateUpdate.finalReport) {
          onEvent({
            type: "report",
            content: stateUpdate.finalReport,
          });
        }
      }
    }

    onEvent({
      type: "done",
      metrics: logger.getMetrics(),
    });
  } catch (error) {
    onEvent({
      type: "error",
      message: error.message,
    });
  }
}
