import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptImplementationStrategyPart2 } from "../prompts/prompt-mini-prd.js";
import {
  generatePRDSection,
  implementationStrategySchema,
  formatImplementationStrategyToMarkdown,
} from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { SemanticCacheFactory } from "../../utils/cache/cache.js";
import { getConfig } from "../../config.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  const cacheInst = await SemanticCacheFactory.createInstance();
  const cached = await cacheInst.getCache({
    prompt: `ImplementationStrategyPart2`,
    scope: {
      nodeName: "nodeImplementationStrategyPart2",
      feature: state.productFeature,
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;

      state.prdImplementationStrategyPart2 = response;

      const config = getConfig();
      const lblPrefix = config.LANGCACHE.ENABLED ? "(Langcache)" : "(Cache)";

      await addSystemMsg(
        state,
        `${lblPrefix} Implementation Strategy Part 2 section generated`,
        STEP_EMOJIS.docWriting
      );
    }
  }

  return isCacheHit;
};

const updateState = async (
  state: OverallStateType,
  implementationStrategyPart2: string
) => {
  const cacheInst = await SemanticCacheFactory.createInstance();
  await cacheInst.setCache({
    prompt: `ImplementationStrategyPart2`,
    response: implementationStrategyPart2,
    scope: {
      nodeName: "nodeImplementationStrategyPart2",
      feature: state.productFeature,
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  state.prdImplementationStrategyPart2 = implementationStrategyPart2;

  await addSystemMsg(
    state,
    "Implementation Strategy Part 2 section generated",
    STEP_EMOJIS.docWriting
  );
};

const nodeImplementationStrategyPart2 = async (state: OverallStateType) => {
  try {
    const isCacheHit = await updateStateFromCache(state);

    if (!isCacheHit) {
      const implementationStrategyPart2Raw = await generatePRDSection(
        state,
        getPromptImplementationStrategyPart2,
        "Implementation Strategy Part 2",
        implementationStrategySchema
      );

      const implementationStrategyPart2 =
        formatImplementationStrategyToMarkdown(implementationStrategyPart2Raw);

      await updateState(state, implementationStrategyPart2);
    }
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeImplementationStrategyPart2 };
