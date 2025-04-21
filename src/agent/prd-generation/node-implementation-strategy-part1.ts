import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptImplementationStrategyPart1 } from "../prompts/prompt-mini-prd.js";
import { generatePRDSection } from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { AgentCache } from "../agent-cache.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  const agentCache = await AgentCache.getInstance();
  const cached = await agentCache.getAgentCache({
    prompt: `ImplementationStrategyPart1`,
    scope: {
      nodeName: "nodeImplementationStrategyPart1",
      feature: state.productFeature,
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;

      state.prdImplementationStrategyPart1 = response;

      await addSystemMsg(
        state,
        `(Cache) Implementation Strategy Part 1 section generated`,
        STEP_EMOJIS.docWriting
      );
    }
  }

  return isCacheHit;
};

const updateState = async (
  state: OverallStateType,
  implementationStrategyPart1: string
) => {
  const agentCache = await AgentCache.getInstance();
  await agentCache.setAgentCache({
    prompt: `ImplementationStrategyPart1`,
    response: implementationStrategyPart1,
    scope: {
      nodeName: "nodeImplementationStrategyPart1",
      feature: state.productFeature,
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  state.prdImplementationStrategyPart1 = implementationStrategyPart1;

  await addSystemMsg(
    state,
    "Implementation Strategy Part 1 section generated",
    STEP_EMOJIS.docWriting
  );
};

const nodeImplementationStrategyPart1 = async (state: OverallStateType) => {
  try {
    const isCacheHit = await updateStateFromCache(state);

    if (!isCacheHit) {
      const implementationStrategyPart1 = await generatePRDSection(
        state,
        getPromptImplementationStrategyPart1,
        "Implementation Strategy Part 1"
      );

      await updateState(state, implementationStrategyPart1);
    }
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeImplementationStrategyPart1 };
