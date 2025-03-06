import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "./llm-open-ai.js";
import { checkErrorToStopWorkflow } from "./error.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { getPromptExtractProductFeature } from "./prompts/prompt-extract-product-feature.js";
import { initializeState } from "./state.js";

const updateState = async (state: OverallStateType, resultJson: any) => {
  if (resultJson?.productFeature) {
    state.productFeature = resultJson.productFeature;

    const detail = `productFeature: \`${resultJson.productFeature}\``;
    state.messages.push(new SystemMessage(detail));
    if (state.onNotifyProgress) {
      await state.onNotifyProgress(STEP_EMOJIS.subStep + detail);
    }
  } else if (resultJson?.error) {
    state.error = resultJson.error;
  } else {
    state.error = "Could not extract product feature";
  }
};

const nodeExtractProductFeature = async (state: OverallStateType) => {
  initializeState(state);

  const SYSTEM_PROMPT = getPromptExtractProductFeature(state);

  const extractProductFeaturePrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
  ]);

  const model = llmOpenAi;
  const outputParser = new JsonOutputParser();

  const chain = RunnableSequence.from([
    extractProductFeaturePrompt,
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

export { nodeExtractProductFeature };
