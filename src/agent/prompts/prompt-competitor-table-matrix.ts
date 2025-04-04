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

    Table Organization Requirements:
    1. Prioritize and list the most important/core capabilities at the top of the table
    2. Group related features together
    3. Place secondary or less critical features lower in the table
    4. Use clear, concise feature descriptions
    5. Highlight any standout or unique capabilities

    Note: Later, the final tables will be converted to PDF, so ensure the formatting is suitable for PDF conversion.

    Input:
     ${inputStr}

    Output:
    - A provider/feature matrix with no more than two competitors per table, with top capabilities prioritized at the beginning
    - A summary of offerings, highlighting the most important features first
    
    Please ensure the matrix is clear, concise, and well-organized with the most critical features appearing first.
`;
  return SYSTEM_PROMPT;
};
