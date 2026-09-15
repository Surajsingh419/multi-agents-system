import { getLLM } from "../llm.js";
import { logger } from "../utils/logger.js";

const llm = getLLM();

export async function factCheckerNode(state) {
  logger.agentStart("Fact-Checker Agent");

  const sourcesList = state.sources
    .map((s, i) => `[${i + 1}] ${s.title} (${s.url})\nEvidence: ${s.snippet}`)
    .join("\n\n");

  const prompt = `You are an independent Fact-Checker Agent. Your job is to verify the factual claims in the research data against the source material provided.

Research Data:
${state.researchData}

Original Source Material:
${sourcesList}

Instructions:
1. Identify 3-4 key factual claims (dates, statistics, events, official statements).
2. For each claim, evaluate if it is supported by the sources.
3. Label each claim with a verification status: ✅ Verified, ⚠️ Partially Verified, or ❌ Unverified.
4. Provide the supporting evidence or explanation.

Format:
## Fact-Check Results

### Claim 1: "[The claim]"
- **Status**: ✅ Verified / ⚠️ Partially Verified / ❌ Unverified
- **Evidence**: [Brief summary of supporting evidence from source]

(Repeat for key claims)

## Summary
- Verified: X | Partially Verified: Y | Unverified: Z
- Overall Confidence: High / Medium / Low`;

  const response = await llm.invoke([
    { role: "system", content: "You are an expert Fact-Checker Agent specialized in claim verification." },
    { role: "user", content: prompt },
  ]);

  const factCheckOutput = response.content;
  logger.agentEnd("Fact-Checker Agent");

  return {
    factCheckResults: factCheckOutput,
    currentAgent: "writer",
    progressEvents: [
      {
        type: "progress",
        agent: "factchecker",
        message: "Fact-checking complete — claims verified against sources",
        timestamp: Date.now(),
      },
    ],
  };
}
