import type { OverallStateType } from "./state.js";

import { RunnableSequence } from "@langchain/core/runnables";
import {
  StringOutputParser,
  StructuredOutputParser,
} from "@langchain/core/output_parsers";
import { z } from "zod";

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
import { LoggerCls } from "../utils/logger.js";

const implementationStrategySchema = z.object({
  requirements: z.array(
    z.object({
      id: z.number(),
      feature: z.string().max(70),
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]),
      rice: z.object({
        reach: z.number().min(1).max(10),
        impact: z.number().min(1).max(10),
        confidence: z.number().min(1).max(10),
        effort: z.number().min(1).max(10),
      }),
      score: z.number(),
      benefits: z.string(),
      technicalScope: z.string(),
    })
  ),
  keyTechnicalConsiderations: z.array(z.string()).min(1),
});

type ImplementationStrategyPart2 = z.infer<typeof implementationStrategySchema>;

const formatImplementationStrategyToMarkdown = (
  data: ImplementationStrategyPart2
): string => {
  const priorityToEmoji = {
    HIGH: "🔴",
    MEDIUM: "🟡",
    LOW: "⚪️",
  };

  let html = `
  ### Prioritized Requirements and Roadmap
  
  <table>
  <tr>
    <th style="text-align:right">ID</th>
    <th style="text-align:left">Feature</th>
    <th style="text-align:center">Priority</th>
    <th style="text-align:center">RICE</th>
    <th style="text-align:right">Score</th>
  </tr>`;

  data.requirements.forEach((req) => {
    const rice = `${req.rice.reach}/${req.rice.impact}/${req.rice.confidence}/${req.rice.effort}`;
    const emojiPriority = priorityToEmoji[req.priority];

    html += `
  <tr>
    <td style="text-align:right" rowspan="3">${req.id}</td>
    <td style="text-align:left">${req.feature}</td>
    <td style="text-align:center">${emojiPriority}</td>
    <td style="text-align:center">${rice}</td>
    <td style="text-align:right">${req.score}</td>
  </tr>
  <tr>
    <td colspan="4" style="text-align:left">Benefits: ${req.benefits}</td>
  </tr>
  <tr>
    <td colspan="4" style="text-align:left">Technical Scope: ${req.technicalScope}</td>
  </tr>`;
  });

  html += `\n</table>
  
  ### Key Technical Considerations`;

  html += "\n<ul>\n";
  data.keyTechnicalConsiderations.forEach((point) => {
    html += `  <li>${point}</li>\n`;
  });
  html += "</ul>";

  return html;
};

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
  sectionName: string,
  structuredSchema: z.ZodSchema | null = null
): Promise<any> => {
  const SYSTEM_PROMPT = promptFn(state);
  const prompt = createChatPrompt(SYSTEM_PROMPT);
  const llm = getLLM();

  let chain;
  if (structuredSchema) {
    const parser = StructuredOutputParser.fromZodSchema(structuredSchema);
    chain = RunnableSequence.from([prompt, llm, parser]);
  } else {
    const parser = new StringOutputParser();
    chain = RunnableSequence.from([prompt, llm, parser]);
  }

  await addSystemMsg(
    state,
    `Generating ${sectionName} section...`,
    STEP_EMOJIS.docWriting
  );

  try {
    const result = await chain.invoke({
      ...state,
    });
    return result;
  } catch (error) {
    LoggerCls.error(`Failed to generate ${sectionName}:`, error);
    throw error;
  }
};

const nodeMiniPrd = async (state: OverallStateType) => {
  const isCacheHit = await updateStateFromCache(state);

  if (!isCacheHit) {
    try {
      // Generate each section separately
      const executiveSummary = (await generatePRDSection(
        state,
        getPromptExecutiveSummary,
        "Executive Summary"
      )) as string;

      const customerAnalysis = (await generatePRDSection(
        state,
        getPromptCustomerAnalysis,
        "Customer Analysis"
      )) as string;

      const marketResearch = (await generatePRDSection(
        state,
        getPromptMarketResearch,
        "Market Research"
      )) as string;

      const productStrategy = (await generatePRDSection(
        state,
        getPromptProductStrategy,
        "Product Strategy"
      )) as string;

      const implementationStrategyPart1 = (await generatePRDSection(
        state,
        getPromptImplementationStrategyPart1,
        "Implementation Strategy Part 1"
      )) as string;

      // Use structured output parser for part 2
      const implementationStrategyPart2Raw = (await generatePRDSection(
        state,
        getPromptImplementationStrategyPart2,
        "Implementation Strategy Part 2",
        implementationStrategySchema
      )) as ImplementationStrategyPart2;

      const implementationStrategyPart2 =
        formatImplementationStrategyToMarkdown(implementationStrategyPart2Raw);

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
