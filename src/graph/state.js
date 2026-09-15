import { Annotation } from "@langchain/langgraph";

export const ResearchState = Annotation.Root({
  query: Annotation({
    reducer: (_, y) => y,
    default: () => "",
  }),

  researchData: Annotation({
    reducer: (_, y) => y,
    default: () => "",
  }),

  sources: Annotation({
    reducer: (_, y) => y,
    default: () => [],
  }),

  factCheckResults: Annotation({
    reducer: (_, y) => y,
    default: () => "",
  }),

  finalReport: Annotation({
    reducer: (_, y) => y,
    default: () => "",
  }),

  currentAgent: Annotation({
    reducer: (_, y) => y,
    default: () => "researcher",
  }),

  progressEvents: Annotation({
    reducer: (x, y) => [...x, ...y],
    default: () => [],
  }),
});
