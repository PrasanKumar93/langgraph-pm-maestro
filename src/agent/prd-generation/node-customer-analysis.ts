import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptCustomerAnalysis } from "../prompts/prompt-mini-prd.js";
import { generatePRDSection } from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { AgentCache } from "../agent-cache.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  const agentCache = await AgentCache.getInstance();
  const cached = await agentCache.getAgentCache({
    prompt: `CustomerAnalysis`,
    scope: {
      nodeName: "nodeCustomerAnalysis",
      feature: state.productFeature,
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;

      state.prdCustomerAnalysis = response;

      await addSystemMsg(
        state,
        `(Cache) Customer Analysis section generated`,
        STEP_EMOJIS.docWriting
      );
    }
  }

  return isCacheHit;
};

const updateState = async (
  state: OverallStateType,
  customerAnalysis: string
) => {
  const agentCache = await AgentCache.getInstance();
  await agentCache.setAgentCache({
    prompt: `CustomerAnalysis`,
    response: customerAnalysis,
    scope: {
      nodeName: "nodeCustomerAnalysis",
      feature: state.productFeature,
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  state.prdCustomerAnalysis = customerAnalysis;

  await addSystemMsg(
    state,
    "Customer Analysis section generated",
    STEP_EMOJIS.docWriting
  );
};

const nodeCustomerAnalysis = async (state: OverallStateType) => {
  try {
    const isCacheHit = await updateStateFromCache(state);

    if (!isCacheHit) {
      const customerAnalysis = await generatePRDSection(
        state,
        getPromptCustomerAnalysis,
        "Customer Analysis"
      );

      await updateState(state, customerAnalysis);
    }
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeCustomerAnalysis };
