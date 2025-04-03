import type { OverallStateType } from "../state.js";

import { getYamlFromJson } from "../../utils/misc.js";

export const getPromptEffortEstimation = (state: OverallStateType) => {
  let jiraDataYaml = getYamlFromJson(state.systemJiraDataList);
  let salesforceDataYaml = getYamlFromJson(state.systemSalesForceDataList);

  const SYSTEM_PROMPT = `
      You are an experienced product manager and software engineer.
Given the product feature "${state.productFeature}", estimate the development effort required.

Consider the following competitor data:
${state.competitorTableMatrix}

Consider the following customer data and market context from the Jira and Salesforce data when making your estimation:
- Data may show customer pain points, feature requests, potential deal sizes and industries
- Data may show current customer workarounds and their business impact, and priority levels across different industries

Note: Jira or Salesforce data is not always complete, accurate or may be empty, so make sure to use the competitor data to make the best estimation.

Return a JSON object with exactly this structure:
{
  "tshirtSize": {
    "size": "M",                // Must be one of: "XS", "S", "M", "L", "XL"
    "personMonths": 4.5,        // Number of person-months
    "rationale": "Medium complexity with existing infrastructure support"
  },
  "components": [
    {
      "name": "Backend API",    // Component/task name
      "description": "Implement REST endpoints for data processing",
      "effortMonths": 2,        // Estimated person-months as number
      "customerImpact": "Enables real-time data access for FinTech Solutions",
      "technicalComplexity": "Medium"  // Must be one of: "Low", "Medium", "High"
    },
    {
      "name": "Frontend UI",
      "description": "Create a user-friendly dashboard for data visualization",
      "effortMonths": 2.5,
      "customerImpact": "Improves user experience for TechStart Solutions",
      "technicalComplexity": "High"
    }
  ]
}

Context:
- Jira Data: 
${jiraDataYaml}
- Salesforce Data: 
${salesforceDataYaml}

Feature: ${state.productFeature}

Important:
1. Return ONLY the JSON object, no additional text or markdown
2. Ensure all numbers are actual numbers, not strings
3. Use proper JSON formatting with double quotes for strings
4. T-shirt size must be one of: "XS", "S", "M", "L", "XL"
5. Technical complexity must be one of: "Low", "Medium", "High"
`;

  return SYSTEM_PROMPT;
};
