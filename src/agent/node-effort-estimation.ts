import type { OverallStateType } from "./state.js";

import { RunnableSequence } from "@langchain/core/runnables";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { z } from "zod";

import { checkErrorToStopWorkflow } from "./error.js";
import { STEP_EMOJIS } from "../utils/constants.js";
import { LoggerCls } from "../utils/logger.js";
import { getPromptEffortEstimation } from "./prompts/prompt-effort-estimation.js";
import { addSystemMsg, createChatPrompt } from "./common.js";
import { getLLM } from "./llms/llm.js";
import { SemanticCacheFactory } from "../utils/cache/cache.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  const cacheInst = await SemanticCacheFactory.createInstance();
  const cached = await cacheInst.getCache({
    prompt: "EffortEstimation",
    scope: {
      feature: state.productFeature,
      nodeName: "nodeEffortEstimation",
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;
      state.effortEstimationData = response;
      await addSystemMsg(
        state,
        "(Cache) Effort estimation completed",
        STEP_EMOJIS.estimation
      );
    }
  }

  return isCacheHit;
};

const updateState = async (state: OverallStateType, resultJson: any) => {
  if (resultJson) {
    const cacheInst = await SemanticCacheFactory.createInstance();
    await cacheInst.setCache({
      prompt: "EffortEstimation",
      response: resultJson,
      scope: {
        feature: state.productFeature,
        nodeName: "nodeEffortEstimation",
        competitorsListStr: [...state.competitorList].sort().join(","),
      },
    });
  }

  state.effortEstimationData = resultJson;
  await addSystemMsg(
    state,
    "Effort estimation completed",
    STEP_EMOJIS.estimation
  );
};

const nodeEffortEstimation = async (state: OverallStateType) => {
  const isCacheHit = await updateStateFromCache(state);

  if (!isCacheHit) {
    try {
      if (!state.competitorTableMatrix?.length) {
        state.error = "No competitor data found";
        checkErrorToStopWorkflow(state);
      }

      const SYSTEM_PROMPT = getPromptEffortEstimation(state);
      const effortEstimationPrompt = createChatPrompt(SYSTEM_PROMPT);
      const llm = getLLM();

      const expectedSchema = z.object({
        tshirtSize: z.object({
          size: z.enum(["XS", "S", "M", "L", "XL"]),
          personMonths: z.number(),
          rationale: z.string(),
        }),
        components: z.array(
          z.object({
            name: z.string(),
            description: z.string(),
            effortMonths: z.number(),
            customerImpact: z.string(),
            technicalComplexity: z.enum(["Low", "Medium", "High"]),
          })
        ),
      });

      const outputParser = StructuredOutputParser.fromZodSchema(expectedSchema);

      const chain = RunnableSequence.from([
        effortEstimationPrompt,
        llm,
        outputParser,
      ]);

      const resultJson = await chain.invoke({
        ...state,
      });

      await updateState(state, resultJson);
    } catch (err) {
      state.error = err;
    }

    checkErrorToStopWorkflow(state);
  }

  return state;
};

export { nodeEffortEstimation };
