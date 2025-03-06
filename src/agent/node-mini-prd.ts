import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "./llm-open-ai.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { getPromptMiniPrd } from "./prompts/prompt-mini-prd.js";
import { checkErrorToStopWorkflow } from "./error.js";
import { addSystemMsg } from "./common.js";

const updateState = async (state: OverallStateType, resultStr: any) => {
  state.outputProductPRD = resultStr;

  await addSystemMsg(
    state,
    "Mini PRD markdown generated",
    STEP_EMOJIS.docWriting
  );
};

const nodeMiniPrd = async (state: OverallStateType) => {
  try {
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
  } catch (err) {
    state.error = err;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeMiniPrd };
