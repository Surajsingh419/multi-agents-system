class Logger {
  constructor() {
    this.reset();
  }

  reset() {
    this.metrics = {
      startTime: Date.now(),
      toolCalls: 0,
      searchCalls: 0,
      scrapeAttempts: 0,
      scrapeSuccesses: 0,
      scrapeFails: 0,
      urlsScraped: [],
      urlsFailed: [],
      agentTransitions: [],
      errors: [],
    };
  }

  agentStart(agentName) {
    const entry = { agent: agentName, startTime: Date.now() };
    this.metrics.agentTransitions.push(entry);
    console.log(`\n🤖 [${agentName}] Starting...`);
  }

  agentEnd(agentName) {
    const transition = this.metrics.agentTransitions.find(
      (t) => t.agent === agentName && !t.endTime
    );
    if (transition) {
      transition.endTime = Date.now();
      transition.duration = transition.endTime - transition.startTime;
      console.log(
        `✅ [${agentName}] Complete (${(transition.duration / 1000).toFixed(1)}s)`
      );
    }
  }

  toolCall(toolName) {
    this.metrics.toolCalls++;
    if (toolName.includes("search") || toolName.includes("tavily")) {
      this.metrics.searchCalls++;
    }
  }

  scrapeResult(url, success, durationMs) {
    this.metrics.scrapeAttempts++;
    if (success) {
      this.metrics.scrapeSuccesses++;
      this.metrics.urlsScraped.push(url);
    } else {
      this.metrics.scrapeFails++;
      this.metrics.urlsFailed.push(url);
    }
  }

  warn(message) {
    console.log(`⚠️  ${message}`);
  }

  error(message) {
    this.metrics.errors.push(message);
    console.error(`❌ ${message}`);
  }

  progress(message) {
    console.log(`📍 ${message}`);
  }

  printSummary() {
    const elapsed = ((Date.now() - this.metrics.startTime) / 1000).toFixed(1);
    const m = this.metrics;

    console.log("\n" + "─".repeat(50));
    console.log("📊 Session Metrics:");
    console.log(`   ⏱️  Total time: ${elapsed}s`);
    console.log(`   🔧 Tool calls: ${m.toolCalls}`);
    console.log(`   🔍 Search calls: ${m.searchCalls}`);
    console.log(
      `   🌐 Scrape: ${m.scrapeSuccesses} success, ${m.scrapeFails} failed`
    );
    if (m.urlsFailed.length > 0) {
      console.log(`   ❌ Failed URLs: ${m.urlsFailed.join(", ")}`);
    }
    console.log(
      `   🤖 Agents: ${m.agentTransitions.map((t) => t.agent).join(" → ")}`
    );
    if (m.errors.length > 0) {
      console.log(`   ⚠️  Errors: ${m.errors.length}`);
    }
    console.log("─".repeat(50));
  }

  getMetrics() {
    return {
      ...this.metrics,
      totalTimeMs: Date.now() - this.metrics.startTime,
    };
  }
}

export const logger = new Logger();
