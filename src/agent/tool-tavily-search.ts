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
import { addSystemMsg } from "./common.js";

const tavilyApiKey = process.env.TAVILY_API_KEY;

const tavilySearch = new TavilySearchResults({
  apiKey: tavilyApiKey,
  maxResults: 10,
});

const searchByTavily = async (query: string) => {
  LoggerCls.debug("Tavily search query: " + query);

  let searchResults: Record<string, any> = {};
  let successMsg = "";
  let errorMsg = "";

  let searchResultsYaml = "";
  let exceptionMsg = "";

  try {
    if (tavilyApiKey && query) {
      const outputParser = new JsonOutputParser();
      const chain = tavilySearch.pipe(outputParser);
      searchResults = await chain.invoke({
        input: query,
      });

      if (Array.isArray(searchResults)) {
        searchResultsYaml = getYamlFromJson(searchResults);
      }
    } else {
      exceptionMsg = "TAVILY_API_KEY or query is not set";
    }
  } catch (err) {
    exceptionMsg = LoggerCls.getPureError(err);
  }

  if (searchResults?.length) {
    successMsg = `Tavily search success
      query: 
        ${query} 
      results: 
        ${searchResultsYaml}`;
  } else if (exceptionMsg) {
    errorMsg = `Tavily search failed
      query: 
        ${query} 
      error: 
        ${exceptionMsg}`;
  }

  return {
    searchResults,
    successMsg,
    errorMsg,
  };
};

const fetchTavilySearchResults = async (
  input: any,
  config: LangGraphRunnableConfig
) => {
  const state = getContextVariable("currentState") as OverallStateType;

  const { searchResults, successMsg, errorMsg } = await searchByTavily(
    input.query
  );

  state.toolTavilySearchData = successMsg || errorMsg;
  state.allTavilySearchDataList.push({
    query: input.query,
    results: searchResults,
  });

  if (successMsg) {
    await addSystemMsg(
      state,
      successMsg,
      STEP_EMOJIS.tool,
      `Tavily search for query: ${input.query}`
    );
  } else if (errorMsg) {
    await addSystemMsg(
      state,
      errorMsg,
      STEP_EMOJIS.error,
      `Tavily search for query: ${input.query} failed`
    );
  }

  //state.error = errorMsg;

  state.toolTavilySearchProcessed = true;
  setContextVariable("currentState", state);

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
