import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptProductStrategy } from "../prompts/prompt-mini-prd.js";
import { generatePRDSection } from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { AgentCache } from "../agent-cache.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  const agentCache = await AgentCache.getInstance();
  const cached = await agentCache.getAgentCache({
    prompt: `ProductStrategy`,
    scope: {
      nodeName: "nodeProductStrategy",
      feature: state.productFeature,
      competitorsList: [...state.competitorList].sort().join(", "),
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;

      state.prdProductStrategy = response;

      await addSystemMsg(
        state,
        `(Cache) Product Strategy section generated`,
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
  const agentCache = await AgentCache.getInstance();
  await agentCache.setAgentCache({
    prompt: `ProductStrategy`,
    response: productStrategy,
    scope: {
      nodeName: "nodeProductStrategy",
      feature: state.productFeature,
      competitorsList: [...state.competitorList].sort().join(", "),
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
