import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "./llm-open-ai.js";
import { getYamlFromJson } from "../utils/misc.js";

const nodeEffortEstimation = async (state: OverallStateType) => {
  let jiraDataYaml = getYamlFromJson(state.systemJiraData);
  let salesforceDataYaml = getYamlFromJson(state.systemSalesForceData);

  const SYSTEM_PROMPT = `
      You are an experienced product manager and software engineer.
Given the product feature "{inputProductFeature}", estimate the development effort required.

Consider the following customer data and market context from the Jira and Salesforce data when making your estimation:
- Data shows customer pain points and feature requests
- Data shows potential deal sizes and industries
- Data shows current customer workarounds and their business impact
- Data shows priority levels across different industries

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

Feature: {inputProductFeature}

Ensure your output is valid JSON with no extra text or markdown formatting.
`;

  const effortEstimationPrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
  ]);

  const model = llmOpenAi;
  const outputParser = new JsonOutputParser();

  const chain = RunnableSequence.from([
    effortEstimationPrompt,
    model,
    outputParser,
  ]);

  const result = await chain.invoke({
    ...state,
  });

  //#region update state
  state.effortEstimationData = result;
  state.messages.push(new SystemMessage(`Effort estimation completed`));
  //#endregion

  return state;
};

export { nodeEffortEstimation };
