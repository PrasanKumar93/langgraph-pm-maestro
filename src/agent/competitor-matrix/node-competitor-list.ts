import type { OverallStateType } from "../state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "../llm-open-ai.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { toolTavilySearch } from "../tool-tavily-search.js";
import { LoggerCls } from "../../utils/logger.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptCompetitorList } from "../prompts/prompt-competitor-list.js";
import { addSystemMsg } from "../common.js";

const reduceCompetitorList = (competitorList: string[]) => {
  let retList = competitorList;
  let count = parseInt(process.env.MAX_COMPETITOR_LIST_COUNT || "0");

  if (count > 0) {
    retList = competitorList.slice(0, count);
  }

  return retList;
};

const updateState = async (state: OverallStateType, rawResult: any) => {
  if (state.toolTavilySearchProcessed) {
    // rawResult = JSON (after tool call)
    const resultJson = rawResult;
    if (resultJson?.data) {
      let competitorList = resultJson.data.split(",");
      competitorList = reduceCompetitorList(competitorList);

      state.competitorList = competitorList;
      state.pendingProcessCompetitorList = [...competitorList];

      const msg = `Competitors found : \`${competitorList.join(", ")}\``;
      await addSystemMsg(state, msg, STEP_EMOJIS.subStep);
      LoggerCls.debug(msg);

      //reset tool status for next node
      state.toolTavilySearchProcessed = false;
      state.toolTavilySearchData = "";
    } else if (resultJson?.error) {
      state.error = resultJson.error;
    }
  } else {
    await addSystemMsg(state, "Competitor Analysis", STEP_EMOJIS.subGraph);

    // rawResult = AI Chunk Message (before tool call)
    state.messages.push(rawResult);
  }
};

const nodeCompetitorList = async (state: OverallStateType) => {
  try {
    const SYSTEM_PROMPT = getPromptCompetitorList(state);

    const competitorListPrompt = ChatPromptTemplate.fromMessages([
      ["system", SYSTEM_PROMPT],
    ]);

    const model = llmOpenAi.bindTools([toolTavilySearch]);

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
  return state;
};

export { nodeCompetitorList };
