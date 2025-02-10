import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import {
  getContextVariable,
  setContextVariable,
} from "@langchain/core/context";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import {
  InputStateAnnotation,
  OverallStateAnnotation,
  OverallStateType,
} from "./state.js";
import { nodeCustomerDemandAnalysis } from "./node-customer-demand-analysis.js";
import { nodeEffortEstimation } from "./node-effort-estimation.js";
import { nodeMiniPrd } from "./node-mini-prd.js";
import { toolSystemSalesForce } from "./tool-system-sales-force.js";
import { toolSystemJira } from "./tool-system-jira.js";

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

  graph
    .addNode("customerDemandAnalysis", nodeCustomerDemandAnalysis)
    .addNode("tools", toolNodeWithGraphState)
    .addNode("effortEstimation", nodeEffortEstimation)
    .addNode("miniPrd", nodeMiniPrd)
    .addEdge(START, "customerDemandAnalysis")
    .addConditionalEdges("customerDemandAnalysis", shouldContinueTools, [
      "tools",
      "effortEstimation",
    ])
    .addEdge("tools", "customerDemandAnalysis")
    .addEdge("effortEstimation", "miniPrd")
    .addEdge("miniPrd", END);

  const finalGraph = graph.compile({
    checkpointer,
  });

  return finalGraph;
};

const compiledGraph = generateGraph();

export { compiledGraph };
