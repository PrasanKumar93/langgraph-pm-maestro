import type { OverallStateType } from "./state.js";

import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { checkErrorToStopWorkflow } from "./error.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { LoggerCls } from "../utils/logger.js";
import { getPromptEffortEstimation } from "./prompts/prompt-effort-estimation.js";
import { addSystemMsg, createChatPrompt } from "./common.js";
import { getLLM } from "./llms/llm.js";
import { AgentCache } from "./agent-cache.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  let sortedCompetitors = [...state.competitorList].sort().join(", ");
  const prompt = `EffortEstimation for ${state.productFeature} with competitors ${sortedCompetitors}`;
  const agentCache = await AgentCache.getInstance();
  const cached = await agentCache.getAgentCache({
    prompt: prompt,
    scope: {
      feature: state.productFeature,
      nodeName: "nodeEffortEstimation",
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;
      state.effortEstimationData = response;
      await addSystemMsg(
        state,
        "(Cache) Effort estimation completed",
        STEP_EMOJIS.estimation
      );
    }
  }

  return isCacheHit;
};

const updateState = async (state: OverallStateType, resultJson: any) => {
  if (resultJson) {
    let sortedCompetitors = [...state.competitorList].sort().join(", ");
    const prompt = `EffortEstimation for ${state.productFeature} with competitors ${sortedCompetitors}`;
    const agentCache = await AgentCache.getInstance();
    await agentCache.setAgentCache({
      prompt: prompt,
      response: resultJson,
      scope: {
        feature: state.productFeature,
        nodeName: "nodeEffortEstimation",
      },
    });
  }

  state.effortEstimationData = resultJson;
  await addSystemMsg(
    state,
    "Effort estimation completed",
    STEP_EMOJIS.estimation
  );
};

const nodeEffortEstimation = async (state: OverallStateType) => {
  const isCacheHit = await updateStateFromCache(state);

  if (!isCacheHit) {
    try {
      if (!state.competitorTableMatrix?.length) {
        state.error = "No competitor data found";
        checkErrorToStopWorkflow(state);
      }

      const SYSTEM_PROMPT = getPromptEffortEstimation(state);

      const effortEstimationPrompt = createChatPrompt(SYSTEM_PROMPT);

      const llm = getLLM();

      const outputParser = new JsonOutputParser();

      const chain = RunnableSequence.from([
        effortEstimationPrompt,
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

export { nodeEffortEstimation };
