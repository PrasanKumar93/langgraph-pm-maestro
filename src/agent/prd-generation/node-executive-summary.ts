import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptExecutiveSummary } from "../prompts/prompt-mini-prd.js";
import { generatePRDSection } from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";

const nodeExecutiveSummary = async (state: OverallStateType) => {
  try {
    const executiveSummary = await generatePRDSection(
      state,
      getPromptExecutiveSummary,
      "Executive Summary"
    );

    state.prdExecutiveSummary = executiveSummary;

    await addSystemMsg(
      state,
      "Executive Summary section generated",
      STEP_EMOJIS.docWriting
    );
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeExecutiveSummary };
