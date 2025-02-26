import type { InputStateType, OverallStateType } from "./state.js";

import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import {
  getContextVariable,
  setContextVariable,
} from "@langchain/core/context";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { InputStateAnnotation, OverallStateAnnotation } from "./state.js";
import { nodeExtractProductFeature } from "./node-extract-product-feature.js";
import { nodeCustomerDemandAnalysis } from "./node-customer-demand-analysis.js";
import { nodeEffortEstimation } from "./node-effort-estimation.js";
import { nodeMiniPrd } from "./node-mini-prd.js";
import { nodeMdToPdf } from "./node-md-to-pdf.js";
import { toolSystemSalesForce } from "./tool-system-sales-force.js";
import { toolSystemJira } from "./tool-system-jira.js";
import { getCompetitorSubgraph } from "./competitor-matrix/workflow.js";

const toolNodeWithGraphState = async (state: OverallStateType) => {
  setContextVariable("currentState", state);
  const toolNodeWithConfig = new ToolNode([
    toolSystemSalesForce,
    toolSystemJira,
  ]);
  const toolResult = await toolNodeWithConfig.invoke(state);

  // Merge the tool's state changes back into the main state
  const toolState = getContextVariable("currentState");
  Object.assign(state, toolState);

  return state;
};

const shouldContinueTools = (state: OverallStateType) => {
  let nextNode = "effortEstimation";

  // If both tools are processed, we should end regardless of tool calls in the message
  // if (state.toolSystemSalesForceProcessed && state.toolSystemJiraProcessed) {
  //   return END;
  // }

  if (state.messages?.length) {
    const lastMessage = state.messages[state.messages.length - 1];

    if (
      lastMessage &&
      "tool_calls" in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls?.length
    ) {
      // If we have a tool call, process it
      nextNode = "tools";
    }
  }
  return nextNode;
};

const generateGraph = () => {
  const checkpointer = new MemorySaver();

  const graph = new StateGraph({
    input: InputStateAnnotation,
    stateSchema: OverallStateAnnotation,
  });

  const competitorSubgraphBuilder = getCompetitorSubgraph();

  graph
    .addNode("extractProductFeature", nodeExtractProductFeature)
    .addNode(
      "competitorSubgraph",
      competitorSubgraphBuilder.compile({
        checkpointer,
      })
    )
    .addNode("customerDemandAnalysis", nodeCustomerDemandAnalysis)
    .addNode("tools", toolNodeWithGraphState)

    .addNode("effortEstimation", nodeEffortEstimation)
    .addNode("miniPrd", nodeMiniPrd)
    .addNode("markdownToPdf", nodeMdToPdf)

    .addEdge(START, "extractProductFeature")
    .addEdge("extractProductFeature", "competitorSubgraph")
    .addEdge("competitorSubgraph", "customerDemandAnalysis")
    .addConditionalEdges("customerDemandAnalysis", shouldContinueTools, [
      "tools",
      "effortEstimation",
    ])
    .addEdge("tools", "customerDemandAnalysis")
    .addEdge("effortEstimation", "miniPrd")
    .addEdge("miniPrd", "markdownToPdf")
    .addEdge("markdownToPdf", END);

  const finalGraph = graph.compile({
    checkpointer,
  });

  return finalGraph;
};

const compiledGraph = generateGraph(); //compiledGraph for langgraph studio

const runWorkflow = async (input: InputStateType) => {
  const graph = generateGraph();
  const result = await graph.invoke(input, {
    configurable: {
      thread_id: crypto.randomUUID(), //MemorySaver checkpointer requires a thread ID for storing state.
    },
  });
  return result;
};

export { compiledGraph, runWorkflow };
