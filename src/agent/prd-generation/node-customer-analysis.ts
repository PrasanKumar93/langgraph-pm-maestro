import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptCustomerAnalysis } from "../prompts/prompt-mini-prd.js";
import { generatePRDSection } from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";

const nodeCustomerAnalysis = async (state: OverallStateType) => {
  try {
    const customerAnalysis = await generatePRDSection(
      state,
      getPromptCustomerAnalysis,
      "Customer Analysis"
    );

    state.prdCustomerAnalysis = customerAnalysis;

    await addSystemMsg(
      state,
      "Customer Analysis section generated",
      STEP_EMOJIS.docWriting
    );
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeCustomerAnalysis };
