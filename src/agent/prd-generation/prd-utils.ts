import type { OverallStateType } from "../state.js";
import { RunnableSequence } from "@langchain/core/runnables";
import {
  StringOutputParser,
  StructuredOutputParser,
} from "@langchain/core/output_parsers";
import { z } from "zod";
import { createChatPrompt } from "../common.js";
import { getLLM } from "../llms/llm.js";
import { LoggerCls } from "../../utils/logger.js";

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

type typeImplementationStrategySchema = z.infer<
  typeof implementationStrategySchema
>;

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

const formatImplementationStrategyToMarkdown = (
  data: typeImplementationStrategySchema
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

export {
  generatePRDSection,
  formatImplementationStrategyToMarkdown,
  implementationStrategySchema,
};

export type { typeImplementationStrategySchema };
