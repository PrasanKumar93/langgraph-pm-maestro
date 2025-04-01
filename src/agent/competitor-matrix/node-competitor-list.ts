import type { OverallStateType } from "../state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { checkErrorToStopWorkflow } from "../error.js";
import { toolTavilySearch } from "../tool-tavily-search.js";
import { LoggerCls } from "../../utils/logger.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptCompetitorList } from "../prompts/prompt-competitor-list.js";
import { addSystemMsg } from "../common.js";
import { getLLM } from "../llms/llm.js";
import { getConfig } from "../../config.js";
import { AgentCache } from "../agent-cache.js";

const reduceCompetitorList = (competitorList: string[]) => {
  const config = getConfig();

  let retList = competitorList;
  let count = parseInt(config.MAX_COMPETITOR_LIST_COUNT);

  if (count > 0) {
    retList = competitorList.slice(0, count);
  }

  return retList;
};

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  const agentCache = await AgentCache.getInstance();
  const cached = await agentCache.getAgentCache({
    prompt: "CompetitorList",
    scope: {
      feature: state.productFeature,
      nodeName: "nodeCompetitorList",
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;
      const competitorList = response.split(",");
      state.competitorList = competitorList;
      state.pendingProcessCompetitorList = [...competitorList];

      const competitorListStr = competitorList.join(", ");
      const msg = `(Cache) Current Competitors : \`${competitorListStr}\``;
      await addSystemMsg(state, msg, STEP_EMOJIS.subStep);
      LoggerCls.debug(msg);
    }
  }

  return isCacheHit;
};

const updateState = async (state: OverallStateType, rawResult: any) => {
  if (state.toolTavilySearchProcessed) {
    // rawResult = JSON (after tool call)
    const resultJson = rawResult;
    if (resultJson?.data) {
      const agentCache = await AgentCache.getInstance();
      await agentCache.setAgentCache({
        prompt: "CompetitorList",
        response: resultJson.data,
        scope: {
          feature: state.productFeature,
          nodeName: "nodeCompetitorList",
        },
      });

      let competitorList = resultJson.data.split(",");
      competitorList = reduceCompetitorList(competitorList);

      state.competitorList = competitorList;
      state.pendingProcessCompetitorList = [...competitorList];

      const msg = `Current Competitors : \`${competitorList.join(", ")}\``;
      await addSystemMsg(state, msg, STEP_EMOJIS.subStep);
      LoggerCls.debug(msg);

      //reset tool status for next node
      state.toolTavilySearchProcessed = false;
      state.toolTavilySearchData = "";
    } else if (resultJson?.error) {
      state.error = resultJson.error;
    }
  } else {
    await addSystemMsg(
      state,
      "Competitor Analysis (Market Research)",
      STEP_EMOJIS.subGraph,
      "Market Research"
    );

    // rawResult = AI Chunk Message (before tool call)
    state.messages.push(rawResult);
  }
};

const nodeCompetitorList = async (state: OverallStateType) => {
  const isCacheHit = await updateStateFromCache(state);

  if (!isCacheHit) {
    try {
      const SYSTEM_PROMPT = getPromptCompetitorList(state);

      const competitorListPrompt = ChatPromptTemplate.fromMessages([
        ["system", SYSTEM_PROMPT],
      ]);

      const llm = getLLM();

      const model = llm.bindTools([toolTavilySearch]);

      const outputParser = new JsonOutputParser();

      let chain: RunnableSequence<any, any> | null = null;

      if (state.toolTavilySearchProcessed) {
        //after tool call
        chain = RunnableSequence.from([
          competitorListPrompt,
          model,
          outputParser,
        ]);
      } else {
        state.toolTavilySearchProcessed = false;
        state.toolTavilySearchData = "";
        //before tool call
        chain = RunnableSequence.from([competitorListPrompt, model]);
      }

      const rawResult = await chain.invoke({
        ...state,
      });

      await updateState(state, rawResult);
    } catch (err) {
      state.error = err;
    }

    checkErrorToStopWorkflow(state);
  }

  return state;
};

export { nodeCompetitorList };
