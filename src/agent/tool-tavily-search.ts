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

const searchByTavily = async (query: string) => {
  LoggerCls.info("Tavily search query: " + query);

  let searchResults: Record<string, any> = {};
  let promptMsg = "";

  let searchResultsYaml = "";
  let errorMessage = "";

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
      errorMessage = "TAVILY_API_KEY or query is not set";
    }
  } catch (err) {
    errorMessage = LoggerCls.getPureError(err);
  }

  if (searchResults?.length) {
    promptMsg = `Tavily search success
      query: 
        ${query} 
      results: 
        ${searchResultsYaml}`;
  } else if (errorMessage) {
    promptMsg = `Tavily search failed
      query: 
        ${query} 
      error: 
        ${errorMessage}`;
  }

  return {
    searchResults,
    promptMsg,
    errorMessage,
  };
};

const fetchTavilySearchResults = async (
  input: any,
  config: LangGraphRunnableConfig
) => {
  const state = getContextVariable("currentState") as OverallStateType;

  const { searchResults, promptMsg, errorMessage } = await searchByTavily(
    input.query
  );

  state.toolTavilySearchData = promptMsg;
  state.allTavilySearchDataList.push({
    query: input.query,
    results: searchResults,
  });
  state.messages.push(new SystemMessage(promptMsg));

  if (state.onNotifyProgress) {
    if (errorMessage) {
      await state.onNotifyProgress(
        `${STEP_EMOJIS.error}Tavily search for query: ${input.query} failed`
      );
    } else {
      await state.onNotifyProgress(
        STEP_EMOJIS.tool + "Tavily search for query: " + input.query
      );
    }
  }
  //state.error = errorMessage;

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
