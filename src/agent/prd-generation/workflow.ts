import type { OverallStateType } from "../state.js";

import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { OverallStateAnnotation } from "../state.js";
import { nodeExecutiveSummary } from "./node-executive-summary.js";
import { nodeCustomerAnalysis } from "./node-customer-analysis.js";
import { nodeMarketResearch } from "./node-market-research.js";
import { nodeProductStrategy } from "./node-product-strategy.js";
import { nodeImplementationStrategyPart1 } from "./node-implementation-strategy-part1.js";
import { nodeImplementationStrategyPart2 } from "./node-implementation-strategy-part2.js";
import { nodeCombinePrdSections } from "./node-combine-prd-sections.js";

export const getPrdGenerationSubgraph = () => {
  const graph = new StateGraph({
    stateSchema: OverallStateAnnotation,
  });

  graph
    .addNode("executiveSummary", nodeExecutiveSummary)
    .addNode("customerAnalysis", nodeCustomerAnalysis)
    .addNode("marketResearch", nodeMarketResearch)
    .addNode("productStrategy", nodeProductStrategy)
    .addNode("implementationStrategyPart1", nodeImplementationStrategyPart1)
    .addNode("implementationStrategyPart2", nodeImplementationStrategyPart2)
    .addNode("combinePrdSections", nodeCombinePrdSections)

    .addEdge(START, "executiveSummary")
    .addEdge("executiveSummary", "customerAnalysis")
    .addEdge("customerAnalysis", "marketResearch")
    .addEdge("marketResearch", "productStrategy")
    .addEdge("productStrategy", "implementationStrategyPart1")
    .addEdge("implementationStrategyPart1", "implementationStrategyPart2")
    .addEdge("implementationStrategyPart2", "combinePrdSections")
    .addEdge("combinePrdSections", END);

  return graph;
};
