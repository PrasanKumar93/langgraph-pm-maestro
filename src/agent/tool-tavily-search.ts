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

const getTavilySearchResults = async (
  input: any,
  config: LangGraphRunnableConfig
) => {
  let retData = "";
  let retError = "";

  if (tavilyApiKey) {
    retData = await tavilySearch.invoke({
      input: input.query,
    });
  } else {
    retError = "TAVILY_API_KEY is not set";
  }

  //testing
  //retData = "MongoDB and Cassandra";

  //#region update shared state
  const state = getContextVariable("currentState") as OverallStateType;

  let detail = "";
  if (retData) {
    detail = `Tavily search success
      query: 
        ${input.query} 
      results: 
        ${retData}`;
  } else if (retError) {
    detail = `Tavily search failed
      query: 
        ${input.query} 
      error: 
        ${retError}`;

    state.error = detail;
  }

  state.messages.push(new SystemMessage(detail));
  if (state.onNotifyProgress) {
    await state.onNotifyProgress("-----> " + detail); //sub step
  }

  state.toolTavilySearchProcessed = true;
  state.toolTavilySearchData = detail;
  setContextVariable("currentState", state);
  //#endregion

  return state;
};

const toolTavilySearch = tool(
  async (input, config: LangGraphRunnableConfig) =>
    await getTavilySearchResults(input, config),
  {
    name: "toolTavilySearch",
    description: "Get Tavily search results",
    schema: z.object({
      query: z.string(),
    }),
  }
);

export { toolTavilySearch };
