import type { InputStateType, OverallStateType } from "../state.js";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import {
  getContextVariable,
  setContextVariable,
} from "@langchain/core/context";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { InputStateAnnotation, OverallStateAnnotation } from "../state.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

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

const nodeCompetitorList = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));

  // Add a simple message without tool calls
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Fetching competitor list..."),
  ];

  state.competitorList = ["SQL Server", "MySQL"];
  state.pendingProcessCompetitorList = [...state.competitorList];

  return state;
};

const nodeCompetitorFeatureDetails = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));

  // Add a message that will trigger the tool call flow
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Fetching competitor feature details..."),
  ];

  state.pendingProcessCompetitorList.shift();

  return state;
};

const nodeCompetitorTableMatrix = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Creating competitor table matrix..."),
  ];
  return state;
};

const nodeCompetitorAnalysisPdf = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Generating competitor analysis PDF..."),
  ];
  return state;
};

const toolTavilySearch = new DynamicStructuredTool({
  name: "tavily_search",
  description: "Search the web for information",
  schema: z.object({
    query: z.string().describe("The search query"),
  }),
  func: async ({ query }) => {
    await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
    return "Search results for: " + query;
  },
});

const toolNodeWithGraphState = async (state: OverallStateType) => {
  const toolNode = new ToolNode([toolTavilySearch]);

  const messageWithSingleToolCall = new AIMessage({
    content: "",
    tool_calls: [
      {
        name: "tavily_search",
        args: { query: "stored procedures" },
        id: "tool_call_id",
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

const scFetchCompetitorList = (state: OverallStateType) => {
  let nextNode = "fetchCompetitorFeatureDetails";
  if (isToolCall("scFetchCompetitorList")) {
    nextNode = "tavilySearchCL";
  }
  return nextNode;
};

const scFetchCompetitorFeatureDetails = (state: OverallStateType) => {
  let nextNode = "createCompetitorTableMatrix";
  if (isToolCall(state.pendingProcessCompetitorList[0])) {
    nextNode = "tavilySearchCFD";
  } else if (state.pendingProcessCompetitorList?.length > 0) {
    nextNode = "fetchCompetitorFeatureDetails";
  }
  return nextNode;
};

const getCompetitorSubgraph = () => {
  const graph = new StateGraph({
    stateSchema: OverallStateAnnotation,
  });

  graph
    .addNode("fetchCompetitorList", nodeCompetitorList)
    .addNode("tavilySearchCL", toolNodeWithGraphState)
    .addNode("tavilySearchCFD", toolNodeWithGraphState)
    .addNode("fetchCompetitorFeatureDetails", nodeCompetitorFeatureDetails)
    .addNode("createCompetitorTableMatrix", nodeCompetitorTableMatrix)
    .addNode("createCompetitorAnalysisPdf", nodeCompetitorAnalysisPdf)
    .addEdge(START, "fetchCompetitorList")
    .addConditionalEdges("fetchCompetitorList", scFetchCompetitorList, [
      "tavilySearchCL",
      "fetchCompetitorFeatureDetails",
    ])
    .addEdge("tavilySearchCL", "fetchCompetitorList")
    .addConditionalEdges(
      "fetchCompetitorFeatureDetails",
      scFetchCompetitorFeatureDetails,
      [
        "tavilySearchCFD",
        "fetchCompetitorFeatureDetails",
        "createCompetitorTableMatrix",
      ]
    )
    .addEdge("tavilySearchCFD", "fetchCompetitorFeatureDetails")
    .addEdge("createCompetitorTableMatrix", "createCompetitorAnalysisPdf")
    .addEdge("createCompetitorAnalysisPdf", END);

  return graph;
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
    .addEdge(START, "extractProductFeature")
    .addEdge("extractProductFeature", "competitorSubgraph")
    .addEdge("competitorSubgraph", END);

  return graph.compile({
    checkpointer,
  });
};

// Export the compiled graph for LangGraph Studio
const compiledGraph = generateGraph();

export { compiledGraph, getCompetitorSubgraph };
