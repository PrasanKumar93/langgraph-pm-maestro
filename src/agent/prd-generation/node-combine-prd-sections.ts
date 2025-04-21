import type { OverallStateType } from "../state.js";
import { addSystemMsg } from "../common.js";
import { STEP_EMOJIS } from "../../utils/constants.js";
import { getTableOfContents } from "../prompts/prompt-mini-prd.js";
import { checkErrorToStopWorkflow } from "../error.js";

const nodeCombinePrdSections = async (state: OverallStateType) => {
  try {
    // Get the table of contents
    const tableOfContents = getTableOfContents(state.productFeature);

    // Combine all sections
    const resultStr = `${tableOfContents}

${state.prdExecutiveSummary}

${state.prdCustomerAnalysis}

${state.prdMarketResearch}

### Competitor Table Matrix
${state.competitorTableMatrix}

${state.prdProductStrategy}

${state.prdImplementationStrategyPart1}
${state.prdImplementationStrategyPart2}`;

    state.outputProductPRD = resultStr;

    await addSystemMsg(
      state,
      "Full mini PRD markdown generated",
      STEP_EMOJIS.docWriting
    );
  } catch (error) {
    state.error = error;
  }

  checkErrorToStopWorkflow(state);

  return state;
};

export { nodeCombinePrdSections };
