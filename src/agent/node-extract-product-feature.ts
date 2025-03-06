import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { checkErrorToStopWorkflow } from "./error.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { getPromptExtractProductFeature } from "./prompts/prompt-extract-product-feature.js";
import { initializeState } from "./state.js";
import { addSystemMsg } from "./common.js";
import { getLLM } from "./llms/llm.js";

const updateState = async (state: OverallStateType, resultJson: any) => {
  if (resultJson?.productFeature) {
    state.productFeature = resultJson.productFeature;

    await addSystemMsg(
      state,
      `productFeature: \`${resultJson.productFeature}\``,
      STEP_EMOJIS.subStep
    );
  } else if (resultJson?.error) {
    state.error = resultJson.error;
  } else {
    state.error = "Could not extract product feature";
  }
};

const nodeExtractProductFeature = async (state: OverallStateType) => {
  try {
    initializeState(state);

    const SYSTEM_PROMPT = getPromptExtractProductFeature(state);

    const extractProductFeaturePrompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT],
    ]);

    const llm = getLLM();

    const outputParser = new JsonOutputParser();

    const chain = RunnableSequence.from([
      extractProductFeaturePrompt,
      llm,
      outputParser,
    ]);

    const resultJson = await chain.invoke({
      ...state,
    });

    await updateState(state, resultJson);
  } catch (err) {
    state.error = err;
  }

  checkErrorToStopWorkflow(state);
  return state;
};

export { nodeExtractProductFeature };
