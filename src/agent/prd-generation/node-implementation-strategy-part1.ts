import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptImplementationStrategyPart1 } from "../prompts/prompt-mini-prd.js";
import { generatePRDSection } from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";

const nodeImplementationStrategyPart1 = async (state: OverallStateType) => {
  try {
    const implementationStrategyPart1 = await generatePRDSection(
      state,
      getPromptImplementationStrategyPart1,
      "Implementation Strategy Part 1"
    );

    state.prdImplementationStrategyPart1 = implementationStrategyPart1;

    await addSystemMsg(
      state,
      "Implementation Strategy Part 1 section generated",
      STEP_EMOJIS.docWriting
    );
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeImplementationStrategyPart1 };
