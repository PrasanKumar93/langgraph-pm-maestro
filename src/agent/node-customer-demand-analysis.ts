import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";

import { llmOpenAi } from "./llm-open-ai.js";
import { toolSystemSalesForce } from "./tool-system-sales-force.js";
import { toolSystemJira } from "./tool-system-jira.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { getPromptCustomerDemandAnalysis } from "./prompts/prompt-customer-demand-analysis.js";
import { checkErrorToStopWorkflow } from "./error.js";

const updateState = async (state: OverallStateType, rawResult: any) => {
  const detail = `Customer demand analysis`;
  state.messages.push(new SystemMessage(detail));
  if (state.onNotifyProgress) {
    await state.onNotifyProgress(STEP_EMOJIS.analysis + detail);
  }
  // rawResult = AI Chunk Message
  state.messages.push(rawResult);
};

const nodeCustomerDemandAnalysis = async (state: OverallStateType) => {
  const SYSTEM_PROMPT = getPromptCustomerDemandAnalysis(state);

  const customerDemandAnalysisPrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
  ]);

  const model = llmOpenAi.bindTools([toolSystemSalesForce, toolSystemJira]);

  const chain = RunnableSequence.from([customerDemandAnalysisPrompt, model]);

  const rawResult = await chain.invoke({
    ...state,
  });

  await updateState(state, rawResult);

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeCustomerDemandAnalysis };
