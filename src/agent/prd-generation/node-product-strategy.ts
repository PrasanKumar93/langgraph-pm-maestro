import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptProductStrategy } from "../prompts/prompt-mini-prd.js";
import { generatePRDSection } from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";

const nodeProductStrategy = async (state: OverallStateType) => {
  try {
    const productStrategy = await generatePRDSection(
      state,
      getPromptProductStrategy,
      "Product Strategy"
    );

    state.prdProductStrategy = productStrategy;

    await addSystemMsg(
      state,
      "Product Strategy section generated",
      STEP_EMOJIS.docWriting
    );
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeProductStrategy };
