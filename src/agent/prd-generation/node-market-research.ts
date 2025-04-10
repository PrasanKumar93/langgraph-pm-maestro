import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptMarketResearch } from "../prompts/prompt-mini-prd.js";
import { generatePRDSection } from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";

const nodeMarketResearch = async (state: OverallStateType) => {
  try {
    const marketResearch = await generatePRDSection(
      state,
      getPromptMarketResearch,
      "Market Research"
    );

    state.prdMarketResearch = marketResearch;

    await addSystemMsg(
      state,
      "Market Research section generated",
      STEP_EMOJIS.docWriting
    );
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeMarketResearch };
