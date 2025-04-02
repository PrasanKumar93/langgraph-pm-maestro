import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { STEP_EMOJIS } from "../utils/constants.js";
import { getPromptMiniPrd } from "./prompts/prompt-mini-prd.js";
import { checkErrorToStopWorkflow } from "./error.js";
import { addSystemMsg } from "./common.js";
import { getLLM } from "./llms/llm.js";
import { AgentCache } from "./agent-cache.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  let sortedCompetitors = [...state.competitorList].sort().join(", ");
  const prompt = `MiniPRD for ${state.productFeature} with competitors ${sortedCompetitors}`;
  const agentCache = await AgentCache.getInstance();
  const cached = await agentCache.getAgentCache({
    prompt: prompt,
    scope: {
      feature: state.productFeature,
      nodeName: "nodeMiniPrd",
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;
      state.outputProductPRD = response;

      await addSystemMsg(
        state,
        "(Cache) Mini PRD markdown generated",
        STEP_EMOJIS.docWriting
      );
    }
  }

  return isCacheHit;
};

const updateState = async (state: OverallStateType, resultStr: any) => {
  if (resultStr) {
    let sortedCompetitors = [...state.competitorList].sort().join(", ");
    const prompt = `MiniPRD for ${state.productFeature} with competitors ${sortedCompetitors}`;
    const agentCache = await AgentCache.getInstance();
    await agentCache.setAgentCache({
      prompt: prompt,
      response: resultStr,
      scope: {
        feature: state.productFeature,
        nodeName: "nodeMiniPrd",
      },
    });
  }

  state.outputProductPRD = resultStr;

  await addSystemMsg(
    state,
    "Mini PRD markdown generated",
    STEP_EMOJIS.docWriting
  );
};

const nodeMiniPrd = async (state: OverallStateType) => {
  const isCacheHit = await updateStateFromCache(state);

  if (!isCacheHit) {
    try {
      const SYSTEM_PROMPT = getPromptMiniPrd(state);

      const miniPrdPrompt = ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_PROMPT],
      ]);

      const llm = getLLM();

      const outputParser = new StringOutputParser();

      const chain = RunnableSequence.from([miniPrdPrompt, llm, outputParser]);

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

export { nodeMiniPrd };
