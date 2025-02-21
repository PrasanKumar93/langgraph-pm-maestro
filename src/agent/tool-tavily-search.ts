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

const tavilyApiKey = process.env.TAVILY_API_KEY;

const tavilySearch = new TavilySearchResults({
  apiKey: tavilyApiKey,
  maxResults: 10,
});

const fetchTavilySearchResults = async (
  input: any,
  config: LangGraphRunnableConfig
) => {
  let searchResults = "";
  let errorMessage = "";

  if (tavilyApiKey) {
    searchResults = await tavilySearch.invoke({
      input: input.query,
    });
  } else {
    errorMessage = "TAVILY_API_KEY is not set";
  }

  //#region update shared state
  const state = getContextVariable("currentState") as OverallStateType;

  let messageDetail = "";
  if (searchResults) {
    messageDetail = `Tavily search success
      query: 
        ${input.query} 
      results: 
        ${searchResults}`;
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
      "-----> " + "Tavily search done for query: " + input.query
    ); //sub step
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
