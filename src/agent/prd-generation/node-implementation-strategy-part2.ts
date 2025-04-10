import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getPromptImplementationStrategyPart2 } from "../prompts/prompt-mini-prd.js";
import {
  generatePRDSection,
  implementationStrategySchema,
  formatImplementationStrategyToMarkdown,
} from "./prd-utils.js";
import { checkErrorToStopWorkflow } from "../error.js";

const nodeImplementationStrategyPart2 = async (state: OverallStateType) => {
  try {
    const implementationStrategyPart2Raw = await generatePRDSection(
      state,
      getPromptImplementationStrategyPart2,
      "Implementation Strategy Part 2",
      implementationStrategySchema
    );

    const implementationStrategyPart2 = formatImplementationStrategyToMarkdown(
      implementationStrategyPart2Raw
    );

    state.prdImplementationStrategyPart2 = implementationStrategyPart2;

    await addSystemMsg(
      state,
      "Implementation Strategy Part 2 section generated",
      STEP_EMOJIS.docWriting
    );
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeImplementationStrategyPart2 };
