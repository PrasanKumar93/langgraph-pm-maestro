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

Return your output as a JSON object with exactly 2 keys:
1. tshirtSize with properties:
   - size: string (one of: "XS", "S", "M", "L", "XL")
   - personMonths: number
   - rationale: string (brief explanation of the sizing)

2. components: Array of component objects, each containing:
   - name: string (component/task name)
   - description: string (work description)
   - effortMonths: number (estimated person-months)
   - customerImpact: string (how it addresses customer needs)
   - technicalComplexity: string (one of: "Low", "Medium", "High")

Example response format in YAML style (but return as JSON):
tshirtSize:
  size: "M"
  personMonths: 4.5
  rationale: "Medium complexity with existing infrastructure support"
components:
  - name: "Backend API"
    description: "Implement REST endpoints for data processing"
    effortMonths: 2
    customerImpact: "Enables real-time data access for FinTech Solutions"
    technicalComplexity: "Medium"
  - name: "Frontend UI"
    description: "Create a user-friendly dashboard for data visualization"
    effortMonths: 2.5
    customerImpact: "Improves user experience for TechStart Solutions"
    technicalComplexity: "High"

Context:
- Jira Data: 
${jiraDataYaml}
- Salesforce Data: 
${salesforceDataYaml}

Feature: ${state.productFeature}

Ensure your output is valid JSON with no extra text or markdown formatting.
`;

  return SYSTEM_PROMPT;
};
