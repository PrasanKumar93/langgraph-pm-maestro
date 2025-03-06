import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "./llm-open-ai.js";
import { checkErrorToStopWorkflow } from "./error.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { getPromptEffortEstimation } from "./prompts/prompt-effort-estimation.js";

const updateState = async (state: OverallStateType, resultJson: any) => {
  state.effortEstimationData = resultJson;
  const detail = `Effort estimation completed`;
  state.messages.push(new SystemMessage(detail));
  if (state.onNotifyProgress) {
    await state.onNotifyProgress(STEP_EMOJIS.estimation + detail);
  }
};

const nodeEffortEstimation = async (state: OverallStateType) => {
  if (!state.competitorTableMatrix?.length) {
    state.error = "No competitor data found";
    checkErrorToStopWorkflow(state);
  }

  const SYSTEM_PROMPT = getPromptEffortEstimation(state);

  const effortEstimationPrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
  ]);

  const model = llmOpenAi;
  const outputParser = new JsonOutputParser();

  const chain = RunnableSequence.from([
    effortEstimationPrompt,
    model,
    outputParser,
  ]);

  const resultJson = await chain.invoke({
    ...state,
  });

  await updateState(state, resultJson);

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeEffortEstimation };
