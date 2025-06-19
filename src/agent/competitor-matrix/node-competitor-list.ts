import type { OverallStateType } from "../state.js";
import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

import { checkErrorToStopWorkflow } from "../error.js";
import { toolTavilySearch } from "../tool-tavily-search.js";
import { LoggerCls } from "../../utils/logger.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptCompetitorList } from "../prompts/prompt-competitor-list.js";
import { addSystemMsg, createChatPrompt } from "../common.js";
import { getLLM } from "../llms/llm.js";
import { getConfig } from "../../config.js";
import { SemanticCacheFactory } from "../../utils/cache/cache.js";

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

  const cacheInst = await SemanticCacheFactory.createInstance();
  const cached = await cacheInst.getCache({
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
      let competitorList = response
        .split(",")
        .map((s: string) => s.trim().replace(/\s+/g, "_"))
        .filter((s: string) => s);
      competitorList = reduceCompetitorList(competitorList);

      state.competitorList = competitorList;
      state.pendingProcessCompetitorList = [...competitorList];

      const competitorListStr = competitorList.join(", ");
      const config = getConfig();
      const lblPrefix = config.LANGCACHE.ENABLED ? "(Langcache)" : "(Cache)";

      const msg = `${lblPrefix} Current Competitors : \`${competitorListStr}\``;
      await addSystemMsg(state, msg, STEP_EMOJIS.subStep);
      LoggerCls.debug(msg);
    }
  }

  return isCacheHit;
};

const updateState = async (state: OverallStateType, rawResult: any) => {
  if (state.toolTavilySearchProcessed) {
    // rawResult = string output (after tool call)
    if (rawResult) {
      const cacheInst = await SemanticCacheFactory.createInstance();
      await cacheInst.setCache({
        prompt: "CompetitorList",
        response: rawResult,
        scope: {
          feature: state.productFeature,
          nodeName: "nodeCompetitorList",
        },
      });

      let competitorList = rawResult
        .split(",")
        .map((s: string) => s.trim().replace(/\s+/g, "_"))
        .filter((s: string) => s); // remove empty string
      competitorList = reduceCompetitorList(competitorList);

      state.competitorList = competitorList;
      state.pendingProcessCompetitorList = [...competitorList];

      const msg = `Current Competitors : \`${competitorList.join(", ")}\``;
      await addSystemMsg(state, msg, STEP_EMOJIS.subStep);
      LoggerCls.debug(msg);

      //reset tool status for next node
      state.toolTavilySearchProcessed = false;
      state.toolTavilySearchData = "";
    } else {
      const msg = `No Competitors Found`;
      await addSystemMsg(state, msg, STEP_EMOJIS.subStep);
      LoggerCls.debug(msg);
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
      const competitorListPrompt = createChatPrompt(SYSTEM_PROMPT);
      const llm = getLLM();

      let chain: RunnableSequence<any, any> | null = null;

      if (state.toolTavilySearchProcessed) {
        // After tool call
        const outputParser = new StringOutputParser();
        chain = RunnableSequence.from([
          competitorListPrompt,
          llm,
          outputParser,
        ]);
      } else {
        // Before tool call
        const model = llm.bindTools([toolTavilySearch]);
        state.toolTavilySearchProcessed = false;
        state.toolTavilySearchData = "";
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
