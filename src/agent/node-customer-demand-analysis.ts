import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";

import { llmOpenAi } from "./llm-open-ai.js";
import { toolSystemSalesForce } from "./tool-system-sales-force.js";
import { toolSystemJira } from "./tool-system-jira.js";
import { STEP_EMOJIS } from "../utils/constants.js";

const nodeCustomerDemandAnalysis = async (state: OverallStateType) => {
  const SYSTEM_PROMPT = `
  You are a seasoned product manager tasked with aggregating customer demand data. 

Given the product feature "${
    state.productFeature
  }", your task is to gather customer demand data from multiple systems:

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
  const detail = `Customer demand analysis`;
  state.messages.push(new SystemMessage(detail));
  if (state.onNotifyProgress) {
    await state.onNotifyProgress(STEP_EMOJIS.analysis + " " + detail);
  }
  state.messages.push(result);
  //#endregion

  return state;
};

export { nodeCustomerDemandAnalysis };
