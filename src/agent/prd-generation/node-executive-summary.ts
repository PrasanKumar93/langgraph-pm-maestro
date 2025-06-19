import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptExecutiveSummary } from "../prompts/prompt-mini-prd.js";
import { generatePRDSection } from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { SemanticCacheFactory } from "../../utils/cache/cache.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  const cacheInst = await SemanticCacheFactory.createInstance();
  const cached = await cacheInst.getCache({
    prompt: `ExecutiveSummary`,
    scope: {
      nodeName: "nodeExecutiveSummary",
      feature: state.productFeature,
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;

      state.prdExecutiveSummary = response;

      await addSystemMsg(
        state,
        `(Cache) Executive Summary section generated`,
        STEP_EMOJIS.docWriting
      );
    }
  }

  return isCacheHit;
};

const updateState = async (
  state: OverallStateType,
  executiveSummary: string
) => {
  const cacheInst = await SemanticCacheFactory.createInstance();
  await cacheInst.setCache({
    prompt: `ExecutiveSummary`,
    response: executiveSummary,
    scope: {
      nodeName: "nodeExecutiveSummary",
      feature: state.productFeature,
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  state.prdExecutiveSummary = executiveSummary;

  await addSystemMsg(
    state,
    "Executive Summary section generated",
    STEP_EMOJIS.docWriting
  );
};

const nodeExecutiveSummary = async (state: OverallStateType) => {
  try {
    const isCacheHit = await updateStateFromCache(state);

    if (!isCacheHit) {
      const executiveSummary = await generatePRDSection(
        state,
        getPromptExecutiveSummary,
        "Executive Summary"
      );

      await updateState(state, executiveSummary);
    }
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeExecutiveSummary };
