import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";

import { llmOpenAi } from "./llm-open-ai.js";
import { toolSystemSalesForce } from "./tool-system-sales-force.js";
import { toolSystemJira } from "./tool-system-jira.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { getPromptCustomerDemandAnalysis } from "./prompts/prompt-customer-demand-analysis.js";
import { checkErrorToStopWorkflow } from "./error.js";
import { addSystemMsg } from "./common.js";

const updateState = async (state: OverallStateType, rawResult: any) => {
  await addSystemMsg(state, "Customer demand analysis", STEP_EMOJIS.analysis);
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
