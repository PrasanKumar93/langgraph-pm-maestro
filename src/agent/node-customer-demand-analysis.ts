import type { OverallStateType } from "./state.js";

import { RunnableSequence } from "@langchain/core/runnables";

import { toolSystemSalesForce } from "./tool-system-sales-force.js";
import { toolSystemJira } from "./tool-system-jira.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { getPromptCustomerDemandAnalysis } from "./prompts/prompt-customer-demand-analysis.js";
import { checkErrorToStopWorkflow } from "./error.js";
import { addSystemMsg, createChatPrompt } from "./common.js";
import { getLLM } from "./llms/llm.js";

const updateState = async (state: OverallStateType, rawResult: any) => {
  await addSystemMsg(state, "Customer demand analysis", STEP_EMOJIS.analysis);
  // rawResult = AI Chunk Message
  state.messages.push(rawResult);
};

const nodeCustomerDemandAnalysis = async (state: OverallStateType) => {
  try {
    const SYSTEM_PROMPT = getPromptCustomerDemandAnalysis(state);

    const customerDemandAnalysisPrompt = createChatPrompt(SYSTEM_PROMPT);

    const llm = getLLM();

    const model = llm.bindTools([toolSystemSalesForce, toolSystemJira]);

    const chain = RunnableSequence.from([customerDemandAnalysisPrompt, model]);

    const rawResult = await chain.invoke({
      ...state,
    });

    await updateState(state, rawResult);
  } catch (err) {
    state.error = err;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeCustomerDemandAnalysis };
