import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "./llm-open-ai.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { getPromptMiniPrd } from "./prompts/prompt-mini-prd.js";
import { checkErrorToStopWorkflow } from "./error.js";

const updateState = async (state: OverallStateType, resultStr: any) => {
  state.outputProductPRD = resultStr;
  const detail = `Mini PRD markdown generated`;
  state.messages.push(new SystemMessage(detail));
  if (state.onNotifyProgress) {
    await state.onNotifyProgress(STEP_EMOJIS.docWriting + detail);
  }
};

const nodeMiniPrd = async (state: OverallStateType) => {
  const SYSTEM_PROMPT = getPromptMiniPrd(state);

  const miniPrdPrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
  ]);

  const model = llmOpenAi;
  const outputParser = new StringOutputParser();

  const chain = RunnableSequence.from([miniPrdPrompt, model, outputParser]);

  const resultStr = await chain.invoke({
    ...state,
  });

  await updateState(state, resultStr);

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeMiniPrd };
