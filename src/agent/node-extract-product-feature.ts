import type { OverallStateType } from "./state.js";

import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { checkErrorToStopWorkflow } from "./error.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { LoggerCls } from "../utils/logger.js";
import { getPromptExtractProductFeature } from "./prompts/prompt-extract-product-feature.js";
import { initializeState } from "./state.js";
import { addSystemMsg, createChatPrompt } from "./common.js";
import { getLLM } from "./llms/llm.js";
import { AgentCache } from "./agent-cache.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  const agentCache = await AgentCache.getInstance();
  const cached = await agentCache.getAgentCache({
    prompt: state.inputText,
    scope: {
      nodeName: "nodeExtractProductFeature",
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;

      state.productFeature = response;

      await addSystemMsg(
        state,
        `(Cache) productFeature: \`${response}\``,
        STEP_EMOJIS.subStep
      );
    }
  }

  return isCacheHit;
};

const updateState = async (state: OverallStateType, resultJson: any) => {
  if (resultJson?.productFeature) {
    const agentCache = await AgentCache.getInstance();
    await agentCache.setAgentCache({
      prompt: state.inputText,
      response: resultJson.productFeature,
      scope: {
        nodeName: "nodeExtractProductFeature",
      },
    });

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
  initializeState(state);

  const isCacheHit = await updateStateFromCache(state);

  if (!isCacheHit) {
    try {
      const SYSTEM_PROMPT = getPromptExtractProductFeature(state);

      const extractProductFeaturePrompt = createChatPrompt(SYSTEM_PROMPT);

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
  }
  return state;
};

export { nodeExtractProductFeature };
