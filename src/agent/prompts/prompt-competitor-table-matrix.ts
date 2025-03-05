import type { OverallStateType } from "../state.js";

export const getPromptCompetitorTableMatrix = (state: OverallStateType) => {
  const inputStr = state.competitorFeatureDetailsList
    .map((item) => {
      return `
      Competitor Name: 
           ${item.competitorName}

      Feature Details: 
           ${item.featureDetails}

      ------------------------------------------     
      `;
    })
    .join("\n");

  const SYSTEM_PROMPT = `
    You are an AI assistant tasked with creating a feature and competitor matrix.
    Use the detailed information collected from each competitor to create a markdown table that shows a feature and competitor matrix. 
    Ensure that each table contains no more than two competitors to maintain readability in PDF format. 
    If there are more than two competitors, create multiple tables, each with two competitors.
    If there is an odd number of competitors, the last table should contain the remaining single competitor.


    Note: Later, the final tables will be converted to PDF, so ensure the formatting is suitable for PDF conversion.

    Input:
     ${inputStr}

    Output:
    - A provider/feature matrix with no more than two competitors per table.
    - A summary of offerings.
    
    Please ensure the matrix is clear, concise, and well-organized.
`;
  return SYSTEM_PROMPT;
};
