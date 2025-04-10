import type { OverallStateType } from "../state.js";
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { OverallStateAnnotation } from "../state.js";
import { AIMessage } from "@langchain/core/messages";

const DELAY_TIME_MS = 500;

// Dummy nodes for visualization
const nodeExecutiveSummary = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Generating Executive Summary section..."),
  ];
  return state;
};

const nodeCustomerAnalysis = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Generating Customer Analysis section..."),
  ];
  return state;
};

const nodeMarketResearch = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Generating Market Research section..."),
  ];
  return state;
};

const nodeProductStrategy = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Generating Product Strategy section..."),
  ];
  return state;
};

const nodeImplementationStrategyPart1 = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Generating Implementation Strategy Part 1 section..."),
  ];
  return state;
};

const nodeImplementationStrategyPart2 = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Generating Implementation Strategy Part 2 section..."),
  ];
  return state;
};

const nodeCombinePrdSections = async (state: OverallStateType) => {
  await new Promise((resolve) => setTimeout(resolve, DELAY_TIME_MS));
  state.messages = [
    ...(state.messages || []),
    new AIMessage("Combining all PRD sections..."),
  ];
  return state;
};

const getPrdGenerationSubgraph = () => {
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

export { getPrdGenerationSubgraph };
