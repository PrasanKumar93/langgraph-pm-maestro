import type { OverallStateType } from "../state.js";

export const getPromptCompetitorList = (state: OverallStateType) => {
  const SYSTEM_PROMPT = `
    You are an experienced product manager and software engineer.
    Given the product feature, perform a web search using the Tavily Search API to identify a list of software competitors offering the particular feature.

    Input:
    - Product Feature: ${state.productFeature}

    IMPORTANT: Return ONLY a JSON object with exactly below structure, no additional text or explanations:
    {
      "data": "competitor1, competitor2, competitor3",
      "error": ""
    }

    Example Output for "Vector Search" feature:
    {
      "data": "Pinecone, MongoDB, Cassandra",
      "error": ""
    }

    ---
    Tool Status:
      is toolTavilySearchProcessed: ${
        state.toolTavilySearchProcessed ? "true" : "false"
      }
    
      ${state.toolTavilySearchData}

    ---  
    Note: 
    1. Do not call tavily search again if it has already been called.
    2. Return ONLY the JSON object, no other text or explanations before or after.
`;
  return SYSTEM_PROMPT;
};
