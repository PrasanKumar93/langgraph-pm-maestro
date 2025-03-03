import type { OverallStateType } from "./state.js";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { SystemMessage } from "@langchain/core/messages";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { llmOpenAi } from "./llm-open-ai.js";
import { getYamlFromJson } from "../utils/misc.js";
import { STEP_EMOJIS } from "../utils/constants.js";

const nodeMiniPrd = async (state: OverallStateType) => {
  let jiraDataYaml = getYamlFromJson(state.systemJiraDataList);
  let salesforceDataYaml = getYamlFromJson(state.systemSalesForceDataList);
  let effortEstimationYaml = getYamlFromJson([state.effortEstimationData]);

  const SYSTEM_PROMPT = `You are an experienced Product Manager tasked with creating a concise mini-PRD. Use the following inputs to create a comprehensive but focused product recommendation:

INPUT CONTEXT:
1. Product Feature: "${state.productFeature}"

2. Competitor Analysis:

 ${state.competitorTableMatrix}

3. Market Analysis:
   The following data from Jira and Salesforce provides customer insights:
   - Data may show customer pain points, feature requests, potential deal sizes and industries
   - Data may show current customer workarounds and their business impact, and priority levels across different industries

   Note: Jira or Salesforce data is not always complete, accurate or may be empty, so make sure to use the competitor data to make the best feature analysis.

Jira Data: 
${jiraDataYaml}

Salesforce Data: 
${salesforceDataYaml}

4. Engineering Effort Analysis:
   Following is the estimation data that includes T-shirt sizing and component breakdown:
   - T-shirt size (XS to XL) with person-months and rationale
   - Detailed component breakdown with effort, impact, and complexity

Effort Estimation Data:
${effortEstimationYaml}

---
REQUIRED OUTPUT:
Create a structured mini-PRD (4-10 pages) with the following sections:

A. Executive Summary
   - Product overview
   - Market opportunity
   - Key recommendations

B. Customer Analysis (use Jira and Salesforce data if available from Market Analysis in input context )
   - Target audience profile
   - Pain points and needs analysis
   - Current workarounds and their impact
   - Feature requests prioritization

C. Product Strategy
   - Goals and success metrics
   - Competitor analysis (use full "Competitor Analysis" provided in input context)
   - Proposed solution and key differentiators
   - MVP scope recommendation

D. Implementation Strategy
   - Effort estimation summary
   - Risk assessment
   - Prioritized capability roadmap using RICE framework
     (Reach, Impact, Confidence, Effort)
   - Key technical considerations

FORMAT:
- Use clear headers and sub-headers
- Include relevant data points to support recommendations
- Keep content concise and actionable
- Use bullet points for better readability
- Highlight critical decisions and their rationale

Focus on providing actionable insights that will help stakeholders make informed decisions about the product feature.`;

  const miniPrdPrompt = ChatPromptTemplate.fromMessages([
    ["system", SYSTEM_PROMPT],
  ]);

  const model = llmOpenAi;
  const outputParser = new StringOutputParser();

  const chain = RunnableSequence.from([miniPrdPrompt, model, outputParser]);

  const result = await chain.invoke({
    ...state,
  });

  //#region update state
  state.outputProductPRD = result;
  const detail = `Mini PRD markdown generated`;
  state.messages.push(new SystemMessage(detail));
  if (state.onNotifyProgress) {
    await state.onNotifyProgress(STEP_EMOJIS.docWriting + detail);
  }
  //#endregion

  return state;
};

export { nodeMiniPrd };
