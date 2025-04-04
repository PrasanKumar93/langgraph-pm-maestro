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

    IMPORTANT OUTPUT CONSTRAINTS:
    - Provide ONLY the markdown tables followed by a summary section
    - Do not include any introductory text or explanations
    - Start directly with the markdown table format
    - Only include the specified sections with no additional commentary

    Input:
     ${inputStr}

    Required Output Format:
    [Tables Section]
    | Feature | Competitor1 | Competitor2 |
    |---------|------------|-------------|
    ...

    Additional tables as needed, with no text in between.

    Summary of Offerings:
    - A prioritized list of the most important features and capabilities
    - Focus on key differentiators and standout features
`;
  return SYSTEM_PROMPT;
};
