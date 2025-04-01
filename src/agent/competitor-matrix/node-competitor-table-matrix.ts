import type { OverallStateType } from "../state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { checkErrorToStopWorkflow } from "../error.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { LoggerCls } from "../../utils/logger.js";
import { getPromptCompetitorTableMatrix } from "../prompts/prompt-competitor-table-matrix.js";
import { addSystemMsg } from "../common.js";
import { getLLM } from "../llms/llm.js";
import { AgentCache } from "../agent-cache.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  let sortedCompetitorList = [...state.competitorList].sort();

  const agentCache = await AgentCache.getInstance();
  const cached = await agentCache.getAgentCache({
    prompt: sortedCompetitorList.join(", "),
    scope: {
      feature: state.productFeature,
      nodeName: "nodeCompetitorTableMatrix",
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;
      state.competitorTableMatrix = response;

      await addSystemMsg(
        state,
        "(Cache) Competitor Table Matrix created",
        STEP_EMOJIS.competitorTable
      );
    }
  }

  return isCacheHit;
};

const updateState = async (state: OverallStateType, resultStr: any) => {
  if (resultStr) {
    let sortedCompetitorList = [...state.competitorList].sort();
    const agentCache = await AgentCache.getInstance();
    await agentCache.setAgentCache({
      prompt: sortedCompetitorList.join(", "),
      response: resultStr,
      scope: {
        feature: state.productFeature,
        nodeName: "nodeCompetitorTableMatrix",
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

      const competitorListPrompt = ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_PROMPT],
      ]);

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
