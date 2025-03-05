import type { OverallStateType } from "../state.js";

export const getPromptCompetitorFeatureDetails = (state: OverallStateType) => {
  let competitorName = state.pendingProcessCompetitorList[0];

  const SYSTEM_PROMPT = `
     You are an AI assistant tasked with gathering detailed information about the competitor "${competitorName}".
    Focus on scraping information specifically related to the product feature "${
      state.productFeature
    }".
    Collect all relevant feature details, any ongoing developments, related features, and supporting information from the competitor's website. 
    In future, this information will be used to create a feature and competitor matrix, a summary of competitor offerings, and detailed competitor feature information.
    Convert the gathered information into Markdown format.

    Input:
    - Competitor Name: "${competitorName}"
    - Product Feature: "${state.productFeature}"

    Output:
    - Detailed information in Markdown format, emphasizing relevance to the product feature.
    
    Please ensure the output is clear, well-organized, and focused on the specified feature.

    ---
    Tool Status:
      is toolTavilySearchProcessed: ${
        state.toolTavilySearchProcessed ? "true" : "false"
      }
    
      ${state.toolTavilySearchData}

    ---  

    IMPORTANT: You MUST use the Tavily search tool to get the latest information for EVERY competitor, even if you think you already know about them. Always call the toolTavilySearch tool first before providing any information.
    
    Do not rely just on your internal knowledge about competitors. Always search for the most up-to-date information using the Tavily search tool, later use your internal knowledge to refine the information.
    
    Note: Do not call tavily search again if it has already been called for the current competitor, check the Tool Status.
`;
  return SYSTEM_PROMPT;
};
