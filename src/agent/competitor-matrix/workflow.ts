import type { InputStateType, OverallStateType } from "../state.js";

import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import {
  getContextVariable,
  setContextVariable,
} from "@langchain/core/context";
import { ToolNode } from "@langchain/langgraph/prebuilt";

import { InputStateAnnotation, OverallStateAnnotation } from "../state.js";
import { nodeCompetitorList } from "./node-competitor-list.js";
import { nodeExtractProductFeature } from "../node-extract-product-feature.js";
import { toolTavilySearch } from "../tool-tavily-search.js";

const toolNodeWithGraphState = async (state: OverallStateType) => {
  setContextVariable("currentState", state);

  const toolNodeWithConfig = new ToolNode([toolTavilySearch]);
  const toolResult = await toolNodeWithConfig.invoke(state);

  // Merge the tool's state changes back into the main state
  const toolState = getContextVariable("currentState");
  Object.assign(state, toolState);

  return state;
};

const isToolCall = (state: OverallStateType) => {
  let isToolCall = false;
  if (state.messages?.length) {
    const lastMessage = state.messages[state.messages.length - 1];

    if (
      lastMessage &&
      "tool_calls" in lastMessage &&
      Array.isArray(lastMessage.tool_calls) &&
      lastMessage.tool_calls?.length
    ) {
      // If we have a tool call, process it
      isToolCall = true;
    }
  }
  return isToolCall;
};

const scFetchCompetitorList = (state: OverallStateType) => {
  //should continue FetchCompetitorList

  let nextNode = END; //add specific node to continue

  if (isToolCall(state)) {
    nextNode = "searchTools";
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
    .addNode("extractProductFeature", nodeExtractProductFeature)
    .addNode("fetchCompetitorList", nodeCompetitorList)
    .addNode("searchTools", toolNodeWithGraphState)

    .addEdge(START, "extractProductFeature")
    .addEdge("extractProductFeature", "fetchCompetitorList")
    .addConditionalEdges("fetchCompetitorList", scFetchCompetitorList, [
      "searchTools",
      END,
    ])
    .addEdge("searchTools", "fetchCompetitorList");

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
