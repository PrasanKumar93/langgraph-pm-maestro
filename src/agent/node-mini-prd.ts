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

2. Market Analysis:
   The following data from Jira and Salesforce provides customer insights:
   - Customer pain points and specific feature requests
   - Deal sizes and target industries
   - Current workarounds and their business impact
   - Priority levels across industries

Jira Data: 
${jiraDataYaml}

Salesforce Data: 
${salesforceDataYaml}

3. Engineering Effort Analysis:
   Following is the estimation data that includes T-shirt sizing and component breakdown:
   - T-shirt size (XS to XL) with person-months and rationale
   - Detailed component breakdown with effort, impact, and complexity

Effort Estimation Data:
${effortEstimationYaml}

REQUIRED OUTPUT:
Create a structured mini-PRD (3-4 pages) with the following sections:

1. Executive Summary
   - Product overview
   - Market opportunity
   - Key recommendations

2. Customer Analysis
   - Target audience profile
   - Pain points and needs analysis
   - Current workarounds and their impact
   - Feature requests prioritization

3. Product Strategy
   - Goals and success metrics
   - Competitor analysis
   - Proposed solution and key differentiators
   - MVP scope recommendation

4. Implementation Strategy
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
    await state.onNotifyProgress(STEP_EMOJIS.docWriting + " " + detail);
  }
  //#endregion

  return state;
};

export { nodeMiniPrd };
