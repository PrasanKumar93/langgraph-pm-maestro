import type { OverallStateType } from "../state.js";

const MARKDOWN_FORMAT_REQUIREMENTS = `FORMAT REQUIREMENTS:
1. Use proper markdown heading tags (##, ###, ####)
2. Use bullet points with proper markdown syntax (-)
3. Use emphasis where appropriate (**bold** or *italic*)
4. Keep content concise and actionable
5. Use proper markdown line breaks between sections
6. If including tables, use proper markdown table syntax
7. Ensure all sections are properly nested under their parent heading`;

const COMMON_PROMPT_REQUIREMENTS = `${MARKDOWN_FORMAT_REQUIREMENTS}
Additional requirements:
8. DO NOT include any introductory or concluding text
9. DO NOT explain what you're about to do or what you've done
10. Start and end with just the section content
11. Ensure heading IDs match the ones used in Table of Contents`;

export const getTableOfContents = (
  productFeature: string
) => `# Mini PRD: ${productFeature}

## Table of Contents
- [Executive Summary](#executive-summary)
  - [Product Overview](#product-overview)
  - [Market Opportunity](#market-opportunity)
  - [Key Pain Points](#key-pain-points)
- [Customer Analysis](#customer-analysis)
  - [Target Audience Profile](#target-audience-profile)
  - [Pain Points and Needs Analysis](#pain-points-and-needs-analysis)
  - [Current Workarounds and Impact](#current-workarounds-and-impact)
  - [Feature Requests Prioritization](#feature-requests-prioritization)
- [Market Research](#market-research)
  - [Competitive Positioning Analysis](#competitive-positioning-analysis)
  - [Key Market Differentiators](#key-market-differentiators)
  - [Competitor Table Matrix](#competitor-table-matrix)
- [Product Strategy](#product-strategy)
  - [Goals and Success Metrics](#goals-and-success-metrics)
  - [Proposed Solution](#proposed-solution)
  - [MVP Scope Recommendation](#mvp-scope-recommendation)
- [Implementation Strategy](#implementation-strategy)
  - [Effort Estimation Summary](#effort-estimation-summary)
  - [Risk Assessment](#risk-assessment)
  - [Prioritized Requirements](#prioritized-requirements)
  - [Prioritized Capability Roadmap](#prioritized-capability-roadmap)
  - [Key Technical Considerations](#key-technical-considerations)

---
`;

export const getPromptExecutiveSummary = (state: OverallStateType) => {
  const SYSTEM_PROMPT = `You are an experienced Product Manager tasked with creating the Executive Summary section of a mini-PRD. Use the following inputs to create a focused summary:

INPUT CONTEXT:
1. Product Feature: "${state.productFeature}"

2. Market Research (Competitor Analysis):
${state.competitorTableMatrix}

3. Market Analysis:
   The following data from Jira and Salesforce provides customer insights:
   - Data may show customer pain points, feature requests, potential deal sizes and industries
   - Data may show current customer workarounds and their business impact, and priority levels across different industries

   Note: Jira or Salesforce data is not always complete, accurate or may be empty, so make sure to use the competitor data to make the best feature analysis.

Jira Data: 
${JSON.stringify(state.systemJiraDataList, null, 2)}

Salesforce Data: 
${JSON.stringify(state.systemSalesForceDataList, null, 2)}

---
REQUIRED OUTPUT:
Create the Executive Summary section in proper markdown format:

## Executive Summary

### Product Overview
[Generate concise product overview focusing on the core value proposition and target market]

### Market Opportunity
[Generate market opportunity analysis highlighting market size, growth potential, and key trends]

### Key Pain Points
[Generate 3-5 critical pain points based on customer demand analysis and market research data]

${COMMON_PROMPT_REQUIREMENTS}
Additional section-specific requirements:
12. Include relevant data points to support identified pain points
13. Keep each section concise and focused on high-level strategic insights
14. Ensure pain points are clearly tied to market and customer evidence`;

  return SYSTEM_PROMPT;
};

export const getPromptCustomerAnalysis = (state: OverallStateType) => {
  const SYSTEM_PROMPT = `You are an experienced Product Manager tasked with creating the Customer Analysis section of a mini-PRD. Use the following inputs to create a detailed analysis:

INPUT CONTEXT:
1. Product Feature: "${state.productFeature}"

2. Market Research (Competitor Analysis):
${state.competitorTableMatrix}

3. Market Analysis:
   The following data from Jira and Salesforce provides customer insights:
   - Data may show customer pain points, feature requests, potential deal sizes and industries
   - Data may show current customer workarounds and their business impact, and priority levels across different industries

   Note: Jira or Salesforce data is not always complete, accurate or may be empty, so make sure to use the competitor data to make the best feature analysis.

Jira Data: 
${JSON.stringify(state.systemJiraDataList, null, 2)}

Salesforce Data: 
${JSON.stringify(state.systemSalesForceDataList, null, 2)}

4. Engineering Effort Analysis:
   Following is the estimation data that includes T-shirt sizing and component breakdown:
   - T-shirt size (XS to XL) with person-months and rationale
   - Detailed component breakdown with effort, impact, and complexity

Effort Estimation Data:
${JSON.stringify(state.effortEstimationData, null, 2)}

---
REQUIRED OUTPUT:
Create the Customer Analysis section in proper markdown format:

## Customer Analysis

### Target Audience Profile
[Generate target audience analysis]

### Pain Points and Needs Analysis
[Generate pain points and needs analysis]

### Current Workarounds and Impact
[Generate workarounds and impact analysis]

### Feature Requests Prioritization
[Generate prioritized feature requests]

${COMMON_PROMPT_REQUIREMENTS}
Additional section-specific requirements:
12. Include relevant data points from Jira and Salesforce data`;

  return SYSTEM_PROMPT;
};

export const getPromptMarketResearch = (state: OverallStateType) => {
  const SYSTEM_PROMPT = `You are an experienced Product Manager tasked with creating the Market Research section of a mini-PRD. Use the following inputs to create a comprehensive market analysis:

INPUT CONTEXT:
1. Product Feature: "${state.productFeature}"

2. Market Research (Competitor Analysis):
${state.competitorTableMatrix}

---
REQUIRED OUTPUT:
Create the Market Research section in proper markdown format:

## Market Research

### Competitive Positioning Analysis
[Generate detailed competitive analysis based on competitor data]

### Key Market Differentiators
[Generate key differentiators and unique value propositions]

${COMMON_PROMPT_REQUIREMENTS}
Additional section-specific requirements:
12. Include relevant data points from competitor analysis
13. Use clear comparisons and contrasts between competitors
14. Highlight unique opportunities in the market`;

  return SYSTEM_PROMPT;
};

export const getPromptProductStrategy = (state: OverallStateType) => {
  const SYSTEM_PROMPT = `You are an experienced Product Manager tasked with creating the Product Strategy section of a mini-PRD. Use the following inputs to create a comprehensive strategy:

INPUT CONTEXT:
1. Product Feature: "${state.productFeature}"

2. Market Research (Competitor Analysis):
${state.competitorTableMatrix}

3. Market Analysis:
   The following data from Jira and Salesforce provides customer insights:
   - Data may show customer pain points, feature requests, potential deal sizes and industries
   - Data may show current customer workarounds and their business impact, and priority levels across different industries

   Note: Jira or Salesforce data is not always complete, accurate or may be empty, so make sure to use the competitor data to make the best feature analysis.

Jira Data: 
${JSON.stringify(state.systemJiraDataList, null, 2)}

Salesforce Data: 
${JSON.stringify(state.systemSalesForceDataList, null, 2)}

---
REQUIRED OUTPUT:
Create the Product Strategy section in proper markdown format:

## Product Strategy

### Goals and Success Metrics
[Generate goals and metrics]

### Proposed Solution
[Generate solution details]

### MVP Scope Recommendation
[Generate MVP recommendations]

${COMMON_PROMPT_REQUIREMENTS}
Additional section-specific requirements:
12. Include relevant data points to support strategy
13. Ensure alignment with market research findings`;

  return SYSTEM_PROMPT;
};

export const getPromptImplementationStrategy = (state: OverallStateType) => {
  const SYSTEM_PROMPT = `You are an experienced Product Manager tasked with creating the Implementation Strategy section of a mini-PRD. Use the following inputs to create an actionable plan:

INPUT CONTEXT:
1. Product Feature: "${state.productFeature}"

2. Market Research (Competitor Analysis):
${state.competitorTableMatrix}

3. Market Analysis:
   The following data from Jira and Salesforce provides customer insights:
   - Data may show customer pain points, feature requests, potential deal sizes and industries
   - Data may show current customer workarounds and their business impact, and priority levels across different industries

   Note: Jira or Salesforce data is not always complete, accurate or may be empty, so make sure to use the competitor data to make the best feature analysis.

Jira Data: 
${JSON.stringify(state.systemJiraDataList, null, 2)}

Salesforce Data: 
${JSON.stringify(state.systemSalesForceDataList, null, 2)}

4. Engineering Effort Analysis:
   Following is the estimation data that includes T-shirt sizing and component breakdown:
   - T-shirt size (XS to XL) with person-months and rationale
   - Detailed component breakdown with effort, impact, and complexity

Effort Estimation Data:
${JSON.stringify(state.effortEstimationData, null, 2)}

---
REQUIRED OUTPUT:
Create the Implementation Strategy section in proper markdown format:

## Implementation Strategy

### Effort Estimation Summary
[Generate effort summary including:
- Overall project size estimation
- Timeline estimates
- Resource requirements
- Key dependencies]

### Risk Assessment
[Generate risk assessment including:
- Technical risks
- Business risks
- Mitigation strategies
- Impact levels (High/Medium/Low)]

### Prioritized Requirements

| ID | Requirements | Benefits | Priority |
|---|-------------|----------|----------|
[Generate detailed requirements (top 20) table following these rules:
- ID: Use hierarchical numbering (e.g., 1, 2, 2.1, 2.2, 3, etc.)
- Requirements: Clear, detailed description of what needs to be implemented
- Benefits: Specific value proposition or impact for users/business
- Priority: HIGH (🔴), MEDIUM (🟡), LOW (⚪️)]

### Prioritized Capability Roadmap
[Generate SRICE framework-based roadmap table for top 10 requirements:

| ID | Requirement | Scope | Reach | Impact | Confidence | Effort | SRICE Score |
|---|-------------|-------|-------|--------|------------|--------|-------------|
Where:
- Scope: Clear definition of feature scope
- Reach: Number of users/customers impacted (1-10)
- Impact: Potential business value (1-10)
- Confidence: Confidence in estimates (1-10)
- Effort: Implementation effort (1-10)
- SRICE Score: (Scope * Reach * Impact * Confidence) / Effort]

### Key Technical Considerations
[Generate technical considerations]

${COMMON_PROMPT_REQUIREMENTS}
Additional section-specific requirements:
12. Requirements must be specific, measurable, and actionable
13. Benefits must clearly articulate business or user value
14. Priority must be justified based on business impact and technical feasibility
15. SRICE scoring must be consistent and well-reasoned
16. Risk assessment must include clear mitigation strategies
17. Effort estimation must be based on complexity and team capacity`;

  return SYSTEM_PROMPT;
};

/*
 Original function
export const getPromptMiniPrd = (state: OverallStateType) => {
  const SYSTEM_PROMPT = `You are an experienced Product Manager tasked with creating a concise mini-PRD. Use the following inputs to create a comprehensive but focused product recommendation:

${BASE_CONTEXT(state)}

---
REQUIRED OUTPUT:
Create a structured mini-PRD (5-10 pages) with the following sections:

A. Executive Summary
   - Product overview
   - Market opportunity
   - Key recommendations

B. Customer Analysis
   - Target audience profile
   - Pain points and needs analysis
   - Current workarounds and their impact
   - Feature requests prioritization

C. Product Strategy
   - Goals and success metrics
   - Market Research
     - Provide detailed analysis of competitive positioning based on the extracted data
     - Key market differentiators identified from competitor comparison
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

  return SYSTEM_PROMPT;
};

*/
