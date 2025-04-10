import type { InputStateType, OverallStateType } from "./state.js";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import {
  getContextVariable,
  setContextVariable,
} from "@langchain/core/context";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { InputStateAnnotation, OverallStateAnnotation } from "./state.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

import { getCompetitorSubgraph } from "./competitor-matrix/workflow-dummy-gif.js";
import { getPrdGenerationSubgraph } from "./prd-generation/workflow-dummy-gif.js";

const DELAY_TIME_MS = 500;

const nodeExtractProductFeature = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Extracting product features..."),
  ];

  state.productFeature = "Stored Procedures";
  return state;
};

const nodeCustomerDemandAnalysis = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));

  // Add a message that will trigger the tool call flow
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Analyzing customer demand..."),
  ];

  return state;
};

const nodeEffortEstimation = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Estimating effort..."),
  ];
  return state;
};

const nodeMdToPdf = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Converting markdown to PDF..."),
  ];
  return state;
};

const toolSystemSalesForce = new DynamicStructuredTool({
  name: "system_sales_force",
  description: "Search Salesforce for customer information",
  schema: z.object({
    query: z.string().describe("The search query"),
  }),
  func: async ({ query }) => {
    await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
    return "Salesforce search results for: " + query;
  },
});

const toolSystemJira = new DynamicStructuredTool({
  name: "system_jira",
  description: "Search Jira for customer information",
  schema: z.object({
    query: z.string().describe("The search query"),
  }),
  func: async ({ query }) => {
    await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
    return "Jira search results for: " + query;
  },
});

const toolNodeWithGraphState = async (state: OverallStateType) => {
  const toolNode = new ToolNode([toolSystemSalesForce, toolSystemJira]);

  const messageWithSingleToolCall = new AIMessage({
    content: "",
    tool_calls: [
      {
        name: "system_sales_force",
        args: { query: "stored procedures" },
        id: "tool_call_id_sf",
        type: "tool_call",
      },
      {
        name: "system_jira",
        args: { query: "stored procedures" },
        id: "tool_call_id_jira",
        type: "tool_call",
      },
    ],
  });

  await toolNode.invoke({ messages: [messageWithSingleToolCall] });

  return state;
};

const toolCallObj: Record<string, boolean> = {};
const isToolCall = (name: string) => {
  if (!toolCallObj[name]) {
    toolCallObj[name] = true;
    return true;
  }
  return false;
};

const shouldContinueTools = (state: OverallStateType) => {
  let nextNode = "effortEstimation";
  if (isToolCall("effortEstimation")) {
    nextNode = "tools";
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
  const prdGenerationSubgraphBuilder = getPrdGenerationSubgraph();

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
    .addNode(
      "prdGenerationSubgraph",
      prdGenerationSubgraphBuilder.compile({
        checkpointer,
      })
    )
    .addNode("markdownToPdf", nodeMdToPdf)
    .addEdge(START, "extractProductFeature")
    .addEdge("extractProductFeature", "competitorSubgraph")
    .addEdge("competitorSubgraph", "customerDemandAnalysis")
    .addConditionalEdges("customerDemandAnalysis", shouldContinueTools, [
      "tools",
      "effortEstimation",
    ])
    .addEdge("tools", "customerDemandAnalysis")
    .addEdge("effortEstimation", "prdGenerationSubgraph")
    .addEdge("prdGenerationSubgraph", "markdownToPdf")
    .addEdge("markdownToPdf", END);

  return graph.compile({
    checkpointer,
  });
};

// Export the compiled graph for LangGraph Studio
const compiledGraph = generateGraph();

export { compiledGraph };
