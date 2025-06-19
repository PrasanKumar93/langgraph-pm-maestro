import type { OverallStateType } from "../state.js";

import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { checkErrorToStopWorkflow } from "../error.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { LoggerCls } from "../../utils/logger.js";
import { getPromptCompetitorTableMatrix } from "../prompts/prompt-competitor-table-matrix.js";
import { addSystemMsg, createChatPrompt } from "../common.js";
import { getLLM } from "../llms/llm.js";
import { SemanticCacheFactory } from "../../utils/cache/cache.js";
import { getConfig } from "../../config.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  const cacheInst = await SemanticCacheFactory.createInstance();
  const cached = await cacheInst.getCache({
    prompt: "CompetitorTableMatrix",
    scope: {
      feature: state.productFeature,
      nodeName: "nodeCompetitorTableMatrix",
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;
      state.competitorTableMatrix = response;

      const config = getConfig();
      const lblPrefix = config.LANGCACHE.ENABLED ? "(Langcache)" : "(Cache)";

      await addSystemMsg(
        state,
        `${lblPrefix} Competitor Table Matrix created`,
        STEP_EMOJIS.competitorTable
      );
    }
  }

  return isCacheHit;
};

const updateState = async (state: OverallStateType, resultStr: any) => {
  if (resultStr) {
    const cacheInst = await SemanticCacheFactory.createInstance();
    await cacheInst.setCache({
      prompt: "CompetitorTableMatrix",
      response: resultStr,
      scope: {
        feature: state.productFeature,
        nodeName: "nodeCompetitorTableMatrix",
        competitorsListStr: [...state.competitorList].sort().join(","),
      },
    });

    await addSystemMsg(
      state,
      "Competitor Table Matrix created",
      STEP_EMOJIS.competitorTable
    );

    state.competitorTableMatrix = resultStr;
  } else {
    state.error = `Failed to create competitor table matrix`;
  }
};

const nodeCompetitorTableMatrix = async (state: OverallStateType) => {
  const isCacheHit = await updateStateFromCache(state);

  if (!isCacheHit) {
    try {
      const SYSTEM_PROMPT = getPromptCompetitorTableMatrix(state);

      const competitorListPrompt = createChatPrompt(SYSTEM_PROMPT);

      const llm = getLLM();

      const outputParser = new StringOutputParser();

      let chain = RunnableSequence.from([
        competitorListPrompt,
        llm,
        outputParser,
      ]);

      const resultStr = await chain.invoke({
        ...state,
      });

      await updateState(state, resultStr);
    } catch (err) {
      state.error = err;
    }

    checkErrorToStopWorkflow(state);
  }
  return state;
};

export { nodeCompetitorTableMatrix };
