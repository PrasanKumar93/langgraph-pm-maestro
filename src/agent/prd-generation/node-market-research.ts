import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptMarketResearch } from "../prompts/prompt-mini-prd.js";
import { generatePRDSection } from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";
import { AgentCache } from "../agent-cache.js";

const updateStateFromCache = async (state: OverallStateType) => {
  let isCacheHit = false;

  const agentCache = await AgentCache.getInstance();
  const cached = await agentCache.getAgentCache({
    prompt: `MarketResearch`,
    scope: {
      nodeName: "nodeMarketResearch",
      feature: state.productFeature,
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  if (cached) {
    const response = cached.response;
    if (response) {
      isCacheHit = true;

      state.prdMarketResearch = response;

      await addSystemMsg(
        state,
        `(Cache) Market Research section generated`,
        STEP_EMOJIS.docWriting
      );
    }
  }

  return isCacheHit;
};

const updateState = async (state: OverallStateType, marketResearch: string) => {
  const agentCache = await AgentCache.getInstance();
  await agentCache.setAgentCache({
    prompt: `MarketResearch`,
    response: marketResearch,
    scope: {
      nodeName: "nodeMarketResearch",
      feature: state.productFeature,
      competitorsListStr: [...state.competitorList].sort().join(","),
    },
  });

  state.prdMarketResearch = marketResearch;

  await addSystemMsg(
    state,
    "Market Research section generated",
    STEP_EMOJIS.docWriting
  );
};

const nodeMarketResearch = async (state: OverallStateType) => {
  try {
    const isCacheHit = await updateStateFromCache(state);

    if (!isCacheHit) {
      const marketResearch = await generatePRDSection(
        state,
        getPromptMarketResearch,
        "Market Research"
      );

      await updateState(state, marketResearch);
    }
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeMarketResearch };
