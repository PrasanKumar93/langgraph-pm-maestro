import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptProductStrategy } from "../prompts/prompt-mini-prd.js";
import { generatePRDSection } from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { SemanticCacheFactory } from "../../utils/cache/cache.js";
import { getConfig } from "../../config.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  const cacheInst = await SemanticCacheFactory.createInstance();
  const cached = await cacheInst.getCache({
    prompt: `ProductStrategy`,
    scope: {
      nodeName: "nodeProductStrategy",
      feature: state.productFeature,
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;

      state.prdProductStrategy = response;

      const config = getConfig();
      const lblPrefix = config.LANGCACHE.ENABLED ? "(Langcache)" : "(Cache)";

      await addSystemMsg(
        state,
        `${lblPrefix} Product Strategy section generated`,
        STEP_EMOJIS.docWriting
      );
    }
  }

  return isCacheHit;
};

const updateState = async (
  state: OverallStateType,
  productStrategy: string
) => {
  const cacheInst = await SemanticCacheFactory.createInstance();
  await cacheInst.setCache({
    prompt: `ProductStrategy`,
    response: productStrategy,
    scope: {
      nodeName: "nodeProductStrategy",
      feature: state.productFeature,
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  state.prdProductStrategy = productStrategy;

  await addSystemMsg(
    state,
    "Product Strategy section generated",
    STEP_EMOJIS.docWriting
  );
};

const nodeProductStrategy = async (state: OverallStateType) => {
  try {
    const isCacheHit = await updateStateFromCache(state);

    if (!isCacheHit) {
      const productStrategy = await generatePRDSection(
        state,
        getPromptProductStrategy,
        "Product Strategy"
      );

      await updateState(state, productStrategy);
    }
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeProductStrategy };
