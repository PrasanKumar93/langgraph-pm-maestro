import type { OverallStateType } from "./state.js";

import { RunnableSequence } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";

import { STEP_EMOJIS } from "../utils/constants.js";
import {
  getPromptExecutiveSummary,
  getPromptCustomerAnalysis,
  getPromptProductStrategy,
  getPromptImplementationStrategyPart1,
  getPromptImplementationStrategyPart2,
  getPromptMarketResearch,
  getTableOfContents,
} from "./prompts/prompt-mini-prd.js";
import { checkErrorToStopWorkflow } from "./error.js";
import { addSystemMsg, createChatPrompt } from "./common.js";
import { getLLM } from "./llms/llm.js";
import { AgentCache } from "./agent-cache.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  let sortedCompetitors = [...state.competitorList].sort().join(", ");
  const prompt = `MiniPRD for ${state.productFeature} with competitors ${sortedCompetitors}`;
  const agentCache = await AgentCache.getInstance();
  const cached = await agentCache.getAgentCache({
    prompt: prompt,
    scope: {
      feature: state.productFeature,
      nodeName: "nodeMiniPrd",
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;
      state.outputProductPRD = response;

      await addSystemMsg(
        state,
        "(Cache) Mini PRD markdown generated",
        STEP_EMOJIS.docWriting
      );
    }
  }

  return isCacheHit;
};

const updateState = async (state: OverallStateType, resultStr: any) => {
  if (resultStr) {
    let sortedCompetitors = [...state.competitorList].sort().join(", ");
    const prompt = `MiniPRD for ${state.productFeature} with competitors ${sortedCompetitors}`;
    const agentCache = await AgentCache.getInstance();
    await agentCache.setAgentCache({
      prompt: prompt,
      response: resultStr,
      scope: {
        feature: state.productFeature,
        nodeName: "nodeMiniPrd",
      },
    });
  }

  state.outputProductPRD = resultStr;

  await addSystemMsg(
    state,
    "Mini PRD markdown generated",
    STEP_EMOJIS.docWriting
  );
};

const generatePRDSection = async (
  state: OverallStateType,
  promptFn: (state: OverallStateType) => string,
  sectionName: string
) => {
  const SYSTEM_PROMPT = promptFn(state);
  const prompt = createChatPrompt(SYSTEM_PROMPT);
  const llm = getLLM();
  const outputParser = new StringOutputParser();
  const chain = RunnableSequence.from([prompt, llm, outputParser]);

  await addSystemMsg(
    state,
    `Generating ${sectionName} section...`,
    STEP_EMOJIS.docWriting
  );

  const result = await chain.invoke({
    ...state,
  });

  return result;
};

const nodeMiniPrd = async (state: OverallStateType) => {
  const isCacheHit = await updateStateFromCache(state);

  if (!isCacheHit) {
    try {
      // Generate each section separately
      const executiveSummary = await generatePRDSection(
        state,
        getPromptExecutiveSummary,
        "Executive Summary"
      );
      const customerAnalysis = await generatePRDSection(
        state,
        getPromptCustomerAnalysis,
        "Customer Analysis"
      );
      const marketResearch = await generatePRDSection(
        state,
        getPromptMarketResearch,
        "Market Research"
      );
      const productStrategy = await generatePRDSection(
        state,
        getPromptProductStrategy,
        "Product Strategy"
      );

      const implementationStrategyPart1 = await generatePRDSection(
        state,
        getPromptImplementationStrategyPart1,
        "Implementation Strategy Part 1"
      );
      const implementationStrategyPart2 = await generatePRDSection(
        state,
        getPromptImplementationStrategyPart2,
        "Implementation Strategy Part 2"
      );

      const tableOfContents = getTableOfContents(state.productFeature);

      // Combine all sections
      const resultStr = `${tableOfContents}

${executiveSummary}

${customerAnalysis}

${marketResearch}

### Competitor Table Matrix
${state.competitorTableMatrix}

${productStrategy}

${implementationStrategyPart1}
${implementationStrategyPart2}`;

      await updateState(state, resultStr);
    } catch (err) {
      state.error = err;
    }

    checkErrorToStopWorkflow(state);
  }

  return state;
};

export { nodeMiniPrd };
