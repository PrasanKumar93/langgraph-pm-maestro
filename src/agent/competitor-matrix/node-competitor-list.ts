import type { OverallStateType } from "../state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "../llm-open-ai.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { toolTavilySearch } from "../tool-tavily-search.js";
import { LoggerCls } from "../../utils/logger.js";
import { STEP_EMOJIS } from "../../utils/constants.js";

const reduceCompetitorList = (competitorList: string[]) => {
  let retList = competitorList;
  let count = parseInt(process.env.MAX_COMPETITOR_LIST_COUNT || "0");

  if (count > 0) {
    retList = competitorList.slice(0, count);
  }

  return retList;
};

const getSystemPrompt = (state: OverallStateType) => {
  const SYSTEM_PROMPT = `
    You are an experienced product manager and software engineer.
    Given the product feature, perform a web search using the Tavily Search API to identify a list of software competitors offering the particular feature.

    Input:
    - Product Feature: ${state.productFeature}

    Output:
    - A result object containing a list of competitors in the 'data' field, with competitors separated by commas.
    - An error message in the 'error' field if the tavily API call fails.

    ---

    Example: Say Product Feature is "Vector Search"

    Response format in YAML style (but return as JSON):
      "data": "Pinecone, MongoDB, Cassandra, ...so on"
      "error": ""

    ---
    Tool Status:
      is toolTavilySearchProcessed: ${
        state.toolTavilySearchProcessed ? "true" : "false"
      }
    
      ${state.toolTavilySearchData}

    ---  
    Note: Do not call tavily search again if it has already been called.
`;
  return SYSTEM_PROMPT;
};

const updateState = async (state: OverallStateType, rawResult: any) => {
  if (state.toolTavilySearchProcessed) {
    // rawResult = JSON (after tool call)
    const jsonResult = rawResult;
    if (jsonResult?.data) {
      let competitorList = jsonResult.data.split(",");
      competitorList = reduceCompetitorList(competitorList);

      state.competitorList = competitorList;
      state.pendingProcessCompetitorList = competitorList;

      const msg =
        STEP_EMOJIS.subStep +
        "Competitors found : `" +
        competitorList.join(", ") +
        "`";
      state.messages.push(new SystemMessage(msg));
      if (state.onNotifyProgress) {
        await state.onNotifyProgress(msg);
      }
      LoggerCls.info("Competitor List: " + competitorList); //DEBUG
    } else if (jsonResult?.error) {
      state.error = jsonResult.error;
    }
  } else {
    const detail = STEP_EMOJIS.subGraph + "Competitor Analysis";
    state.messages.push(new SystemMessage(detail));
    if (state.onNotifyProgress) {
      await state.onNotifyProgress(detail);
    }

    // rawResult = AI Chunk Message (before tool call)
    state.messages.push(rawResult);
  }
};

const nodeCompetitorList = async (state: OverallStateType) => {
  const SYSTEM_PROMPT = getSystemPrompt(state);

  const competitorListPrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
  ]);

  const model = llmOpenAi.bindTools([toolTavilySearch]);

  const outputParser = new JsonOutputParser();

  let chain: RunnableSequence<any, any> | null = null;

  if (state.toolTavilySearchProcessed) {
    //after tool call
    chain = RunnableSequence.from([competitorListPrompt, model, outputParser]);
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

  checkErrorToStopWorkflow(state);
  return state;
};

export { nodeCompetitorList };
