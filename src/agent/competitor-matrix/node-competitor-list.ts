import type { OverallStateType } from "../state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "../llm-open-ai.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { toolTavilySearch } from "../tool-tavily-search.js";

const nodeCompetitorList = async (state: OverallStateType) => {
  const SYSTEM_PROMPT = `
    You are an experienced product manager and software engineer.
    Given the product name and feature, perform a web search using the Tavily Search API to identify a list of competitors offering the particular feature.

    Input:
    - Product Name: ${state.productName}
    - Product Feature: ${state.productFeature}

    Output:
    - A result object containing a list of competitors in the 'data' field, with competitors separated by commas.
    - An error message in the 'error' field if the tavily API call fails.

    ---

    Example: Say Product Name is "Redis" and Product Feature is "Real time analytics"

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

  const competitorListPrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
  ]);

  const model = llmOpenAi.bindTools([toolTavilySearch]);

  const outputParser = new JsonOutputParser();

  //@ts-ignore
  const chain = RunnableSequence.from([
    competitorListPrompt,
    model,
    ...(state.toolTavilySearchProcessed ? [outputParser] : []),
  ]);

  const rawResult = await chain.invoke({
    ...state,
  });

  //#region update state
  const detail = `Competitor List Node executed!`;
  state.messages.push(new SystemMessage(detail));
  //   if (state.onNotifyProgress) {
  //     await state.onNotifyProgress(STEP_EMOJIS.analysis + " " + detail);
  //   }
  //state.messages.push(rawResult);
  //#endregion

  if (state.toolTavilySearchProcessed) {
    // JSON Result
    console.log("rawResult", rawResult);
    if (rawResult?.data) {
      state.competitorList = rawResult.data.split(",");
      state.messages.push(
        new SystemMessage("Competitors found: " + rawResult.data)
      );
    } else if (rawResult?.error) {
      if (!state.error) {
        state.error = "";
      }
      state.error += rawResult.error;
    }
  } else {
    // AI Chunk Message
    state.messages.push(rawResult);
  }

  checkErrorToStopWorkflow(state);
  return state;
};

export { nodeCompetitorList };
