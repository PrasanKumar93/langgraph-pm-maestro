import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";

import { llmOpenAi } from "./llm-open-ai.js";
import { toolSystemSalesForce } from "./tool-system-sales-force.js";
import { toolSystemJira } from "./tool-system-jira.js";

const initializeState = (state: OverallStateType) => {
  if (!state.systemSalesForceData) {
    state.systemSalesForceData = [];
  }
  if (!state.systemJiraData) {
    state.systemJiraData = [];
  }
  state.outputProductPRD = "";
};

const nodeCustomerDemandAnalysis = async (state: OverallStateType) => {
  initializeState(state);

  const SYSTEM_PROMPT = `
  You are a seasoned product manager tasked with aggregating customer demand data. 

Given the product feature "{inputProductFeature}", your task is to gather customer demand data from multiple systems:

1. Salesforce  

2. JIRA  

IMPORTANT INSTRUCTIONS:
- Call each tool exactly once
- Do not call a tool that shows "executed" status
- Once both tools show "executed", you MUST stop making tool calls and instead move to next step

Current progress:
- Salesforce tool: ${
    state.toolSystemSalesForceProcessed ? "executed" : "not executed"
  }
- JIRA tool: ${state.toolSystemJiraProcessed ? "executed" : "not executed"}
`;

  const customerDemandAnalysisPrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
  ]);

  const model = llmOpenAi.bindTools([toolSystemSalesForce, toolSystemJira]);

  const chain = RunnableSequence.from([customerDemandAnalysisPrompt, model]);

  const result = await chain.invoke({
    ...state,
  });

  //#region update state
  state.messages.push(new SystemMessage(`Customer demand analysis !`));
  state.messages.push(result);
  //#endregion

  return state;
};

export { nodeCustomerDemandAnalysis };
