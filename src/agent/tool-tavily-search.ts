import type { OverallStateType } from "./state.js";

import { LangGraphRunnableConfig } from "@langchain/langgraph";
import { tool } from "@langchain/core/tools";
import {
  getContextVariable,
  setContextVariable,
} from "@langchain/core/context";
import { SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { LoggerCls } from "../utils/logger.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { getYamlFromJson } from "../utils/misc.js";

const tavilyApiKey = process.env.TAVILY_API_KEY;

const tavilySearch = new TavilySearchResults({
  apiKey: tavilyApiKey,
  maxResults: 10,
});

const fetchTavilySearchResults = async (
  input: any,
  config: LangGraphRunnableConfig
) => {
  let searchResults: Record<string, any> = {};
  let searchResultsYaml = "";
  let errorMessage = "";

  if (tavilyApiKey) {
    try {
      const outputParser = new JsonOutputParser();
      const chain = tavilySearch.pipe(outputParser);
      searchResults = await chain.invoke({
        input: input.query,
      });

      if (Array.isArray(searchResults)) {
        searchResultsYaml = getYamlFromJson(searchResults);
      }
    } catch (error) {
      errorMessage = LoggerCls.getPureError(error);
    }
  } else {
    errorMessage = "TAVILY_API_KEY is not set";
  }

  LoggerCls.info("Tavily search query: " + input.query);

  //#region update shared state
  const state = getContextVariable("currentState") as OverallStateType;

  let messageDetail = "";
  if (searchResults) {
    messageDetail = `Tavily search success
      query: 
        ${input.query} 
      results: 
        ${searchResultsYaml}`;
  } else if (errorMessage) {
    messageDetail = `Tavily search failed
      query: 
        ${input.query} 
      error: 
        ${errorMessage}`;

    state.error = messageDetail;
  }

  state.messages.push(new SystemMessage(messageDetail));
  if (state.onNotifyProgress) {
    await state.onNotifyProgress(
      STEP_EMOJIS.tool + "Tavily search for query: " + input.query
    );
  }

  state.toolTavilySearchProcessed = true;
  state.toolTavilySearchData = messageDetail;
  state.allTavilySearchDataList.push({
    query: input.query,
    results: searchResults,
  });

  setContextVariable("currentState", state);
  //#endregion

  return state;
};

const toolTavilySearch = tool(
  async (input, config: LangGraphRunnableConfig) =>
    await fetchTavilySearchResults(input, config),
  {
    name: "toolTavilySearch",
    description: "Get Tavily search results",
    schema: z.object({
      query: z.string(),
    }),
  }
);

export { toolTavilySearch };
