import type { OverallStateType } from "../state.js";

export const getPromptCompetitorList = (state: OverallStateType) => {
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
